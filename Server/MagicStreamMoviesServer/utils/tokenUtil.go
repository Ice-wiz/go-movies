package utils

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/ice-wiz/MagicStreamMovies/Server/MagicStreamMoviesServer/database"
	"github.com/ice-wiz/MagicStreamMovies/Server/MagicStreamMoviesServer/models"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"golang.org/x/crypto/bcrypt"
)

type SignedDetails struct {
	Type string `json:"type"`

	UserId    string `json:"user_id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Role      string `json:"role"`

	jwt.RegisteredClaims
}

func GenerateAllTokens(user models.User) (accessToken string, refreshToken string, err error) {

	if err := godotenv.Load(".env"); err != nil {
		log.Println("Warn: unable to find .env")
	}

	accessSecret := os.Getenv("SECRET_KEY")
	refreshSecret := os.Getenv("SECRET_REFRESH_KEY")

	if accessSecret == "" || refreshSecret == "" {
		log.Fatal("jwt secrets not set in env")
	}

	// ---------- ACCESS TOKEN CLAIMS ----------

	accessClaims := &SignedDetails{
		Type:      "access",
		UserId:    user.UserID,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Email:     user.Email,
		Role:      user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   user.UserID,
		},
	}

	accessTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessToken, err = accessTokenObj.SignedString([]byte(accessSecret))

	if err != nil {
		return "", "", err
	}

	// ---------- REFRESH TOKEN CLAIMS ----------

	refreshClaims := &SignedDetails{
		Type:   "refresh",
		UserId: user.UserID,
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)), // 7 days
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   user.UserID,
		},
	}

	refreshTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshToken, err = refreshTokenObj.SignedString([]byte(refreshSecret))

	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

func validateToken(tokenString string, secret string) (*SignedDetails, error) {
	claims := &SignedDetails{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

func ValidateAccessToken(tokenString string) (*SignedDetails, error) {
	if err := godotenv.Load(".env"); err != nil {
		log.Println("Warn: unable to find .env")
	}
	secret := os.Getenv("SECRET_KEY")
	claims, err := validateToken(tokenString, secret)
	if err != nil {
		return nil, err
	}

	if claims.Type != "access" {
		return nil, errors.New("not an access token")
	}

	// Check expiration explicitly
	if claims.ExpiresAt != nil && claims.ExpiresAt.Time.Before(time.Now()) {
		return nil, errors.New("token has expired")
	}

	return claims, nil
}

func ValidateRefreshToken(tokenString string) (*SignedDetails, error) {
	if err := godotenv.Load(".env"); err != nil {
		log.Println("Warn: unable to find .env")
	}
	secret := os.Getenv("SECRET_REFRESH_KEY")
	claims, err := validateToken(tokenString, secret)
	if err != nil {
		return nil, err
	}

	if claims.Type != "refresh" {
		return nil, errors.New("not a refresh token")
	}

	// Check expiration explicitly
	if claims.ExpiresAt != nil && claims.ExpiresAt.Time.Before(time.Now()) {
		return nil, errors.New("refresh token has expired")
	}

	return claims, nil
}

// UpdateAllTokens stores refresh token (hashed) and updates timestamp.
// Access tokens are NOT stored - they are stateless JWTs validated by signature only.
//
// Security improvements:
// - Access token removed from storage (stateless validation)
// - Refresh token is hashed before storage (prevents plain-text exposure)
// - Only refresh token stored (for revocation/rotation)

func UpdateAllTokens(userId, accessToken, refreshToken string, client *mongo.Client) error {
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
	defer cancel()

	// Hash the refresh token before storing (security best practice)
	// This prevents plain-text token exposure if database is compromised
	hashedRefreshToken, err := bcrypt.GenerateFromPassword([]byte(refreshToken), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash refresh token: %w", err)
	}

	updateAt := time.Now()
	updateData := bson.M{
		"$set": bson.M{
			// Access token NOT stored - it's stateless, validated by signature only
			// Storing it would defeat the purpose of JWT and require DB lookup on every request
			"refresh_token_hash": string(hashedRefreshToken), // Hashed for security
			"updated_at":         updateAt,
		},
		// Remove old plain-text tokens if they exist (migration)
		"$unset": bson.M{
			"token":         "",
			"refresh_token": "",
		},
	}

	userCollection := database.OpenCollection("users", client)
	_, err = userCollection.UpdateOne(ctx, bson.M{"user_id": userId}, updateData)
	if err != nil {
		return fmt.Errorf("failed to update tokens in database: %w", err)
	}

	return nil
}

// ValidateRefreshTokenFromDB validates a refresh token by comparing it with the hashed version in database.
// This is called during token refresh to ensure the token hasn't been revoked.
func ValidateRefreshTokenFromDB(userId, refreshToken string, client *mongo.Client) error {

	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
	defer cancel()

	userCollection := database.OpenCollection("users", client)

	// Get user document with refresh_token_hash
	var user bson.M
	err := userCollection.FindOne(ctx, bson.M{"user_id": userId}).Decode(&user)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Get the hashed refresh token from database
	hashedToken, ok := user["refresh_token_hash"].(string)
	if !ok || hashedToken == "" {
		return errors.New("refresh token not found for user")
	}

	// Compare provided token with stored hash
	err = bcrypt.CompareHashAndPassword([]byte(hashedToken), []byte(refreshToken))
	if err != nil {
		return errors.New("invalid refresh token")
	}

	return nil
}

// RevokeRefreshToken clears the refresh token for a user (logout).
func RevokeRefreshToken(userId string, client *mongo.Client) error {
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
	defer cancel()

	updateData := bson.M{
		"$unset": bson.M{
			"refresh_token_hash": "",
		},
		"$set": bson.M{
			"updated_at": time.Now(),
		},
	}

	userCollection := database.OpenCollection("users", client)
	_, err := userCollection.UpdateOne(ctx, bson.M{"user_id": userId}, updateData)
	return err
}

func GetAccessToken(c *gin.Context) (string, error) {
	tokenString, err := c.Cookie("access_token")
	if err != nil {
		return "", errors.New("unable to retrieve access token from cookie")
	}
	return tokenString, nil
}

func GetUserIdFromContext(c *gin.Context) (string, error) {
	userId, exists := c.Get("userId")
	if !exists {
		return "", errors.New("userId does not exist in this context")
	}

	id, ok := userId.(string)
	if !ok {
		return "", errors.New("unable to retrieve userId")
	}

	return id, nil
}

func GetRoleFromContext(c *gin.Context) (string, error) {
	role, exists := c.Get("role")
	if !exists {
		return "", errors.New("role does not exist in this context")
	}

	memberRole, ok := role.(string)
	if !ok {
		return "", errors.New("unable to retrieve role")
	}

	return memberRole, nil
}
