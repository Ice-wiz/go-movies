package controllers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/ice-wiz/MagicStreamMovies/Server/MagicStreamMoviesServer/database"
	"github.com/ice-wiz/MagicStreamMovies/Server/MagicStreamMoviesServer/models"
	"github.com/ice-wiz/MagicStreamMovies/Server/MagicStreamMoviesServer/utils"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"golang.org/x/crypto/bcrypt"
)

// HashPassword hashes a plain text password using bcrypt
func HashPassword(password string) (string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedPassword), nil
}

// RegisterUser creates a new user account
func RegisterUser(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		// The original code tried to create a new context with a timeout using "ctx",
		// but "ctx" was not defined yet. We fix this by starting with context.Background().
		// This provides a root context suitable for starting new values.
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var user models.User

		// 1. Bind JSON request to User struct
		if err := c.ShouldBindJSON(&user); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data", "details": err.Error()})
			return
		}

		// 2. Validate input
		validate := validator.New()
		if err := validate.Struct(user); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
			return
		}

		// 3. Check if email already exists
		userCollection := database.OpenCollection("users", client)
		count, err := userCollection.CountDocuments(ctx, bson.D{{Key: "email", Value: user.Email}})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check existing user"})
			return
		}
		if count > 0 {
			c.JSON(http.StatusConflict, gin.H{"error": "User with this email already exists"})
			return
		}

		// 4. Hash password
		hashedPassword, err := HashPassword(user.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to hash password"})
			return
		}

		// 5. Generate UserID and set defaults (do not set Token/RefreshToken - we store hashed refresh only)
		oid := bson.NewObjectID()
		user.ID = oid
		user.UserID = oid.Hex()
		user.CreatedAt = time.Now()
		user.UpdatedAt = time.Now()
		user.Password = hashedPassword // Replace plain password with hash
		user.Role = models.RoleUser    // Default role

		// 6. Insert user into database (no plain-text tokens stored)
		_, err = userCollection.InsertOne(ctx, user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}

		// 7. Generate tokens and store hashed refresh token only
		accessToken, refreshToken, err := utils.GenerateAllTokens(user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to generate tokens"})
			return
		}
		if err := utils.UpdateAllTokens(user.UserID, accessToken, refreshToken, client); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update tokens"})
			return
		}

		// 10. Set cookies

		c.SetCookie(
			"access_token",
			accessToken,
			3600*24,     // 24 hours
			"/",
			"localhost",
			false, // secure (set to true in production with HTTPS)
			true,  // httpOnly
		)

		c.SetCookie(
			"refresh_token",
			refreshToken,
			3600*24*7, // 7 days
			"/",
			"localhost",
			false, // secure (set to true in production)
			true,  // httpOnly
		)

		// 8. Return success response (tokens are in cookies; optionally omit from body for security)
		userResponse := models.UserResponse{
			UserID:          user.UserID,
			FirstName:       user.FirstName,
			LastName:        user.LastName,
			Email:           user.Email,
			Role:            user.Role,
			FavouriteGenres: user.FavouriteGenres,
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "User registered successfully",
			"user":    userResponse,
		})
	}
}

func LoginUser(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var userLogin models.UserLogin

		// 1. Bind JSON request to userLogin struct
		if err := c.ShouldBindJSON(&userLogin); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data", "details": err.Error()})
			return
		}

		// 2. Validate input
		validate := validator.New()
		if err := validate.Struct(userLogin); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
			return
		}

		// 3. Find user by email
		userCollection := database.OpenCollection("users", client)
		var foundUser models.User
		err := userCollection.FindOne(ctx, bson.M{"email": userLogin.Email}).Decode(&foundUser)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query user"})
			}
			return
		}

		// 4. Verify password
		if err := bcrypt.CompareHashAndPassword([]byte(foundUser.Password), []byte(userLogin.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			return
		}

		// 5. Generate tokens
		accessToken, refreshToken, err := utils.GenerateAllTokens(foundUser)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to generate tokens"})
			return
		}

		// 6. Update tokens in database (hashed refresh token)
		if err := utils.UpdateAllTokens(foundUser.UserID, accessToken, refreshToken, client); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update tokens"})
			return
		}

		// 7. Set cookies (HTTP-only, Secure in production)
		c.SetCookie(
			"access_token",
			accessToken,
			3600*24,        // 24 hours
			"/",            // path
			"localhost",    // domain
			false,          // secure (set to true in production with HTTPS)
			true,           // httpOnly
		)

		c.SetCookie(
			"refresh_token",
			refreshToken,
			3600*24*7,      // 7 days
			"/",
			"localhost",
			false,          // secure (set to true in production)
			true,           // httpOnly
		)

		// 8. Return success response (tokens in cookies only; omit from body for security)
		userResponse := models.UserResponse{
			UserID:          foundUser.UserID,
			FirstName:       foundUser.FirstName,
			LastName:        foundUser.LastName,
			Email:           foundUser.Email,
			Role:            foundUser.Role,
			FavouriteGenres: foundUser.FavouriteGenres,
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "User logged in successfully",
			"user":    userResponse,
		})
	}
}

// Logout revokes the refresh token and clears cookies.
// Works with valid access token (userId from context) or refresh token cookie only (e.g. when access token expired).
func Logout(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		var userId string

		// Try to get userId from context (valid access token)
		if id, err := utils.GetUserIdFromContext(c); err == nil {
			userId = id
		} else if refreshToken, err := c.Cookie("refresh_token"); err == nil && refreshToken != "" {
			// No valid access token; try refresh token from cookie (allows logout when access token expired)
			claims, err := utils.ValidateRefreshToken(refreshToken)
			if err != nil {
				// Invalid refresh token; still clear cookies
				clearAuthCookies(c)
				c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
				return
			}
			userId = claims.UserId
		}

		if userId != "" {
			if err := utils.RevokeRefreshToken(userId, client); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to logout"})
				return
			}
		}

		clearAuthCookies(c)
		c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
	}
}

// clearAuthCookies clears access_token and refresh_token cookies
func clearAuthCookies(c *gin.Context) {
	c.SetCookie("access_token", "", -1, "/", "localhost", false, true)
	c.SetCookie("refresh_token", "", -1, "/", "localhost", false, true)
}

// RefreshToken generates new access token using refresh token
func RefreshToken(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		// Get refresh token from cookie
		refreshToken, err := c.Cookie("refresh_token")
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No refresh token provided"})
			return
		}

		// Validate refresh token signature
		claims, err := utils.ValidateRefreshToken(refreshToken)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired refresh token"})
			return
		}

		// Verify refresh token exists in database (not revoked)
		if err := utils.ValidateRefreshTokenFromDB(claims.UserId, refreshToken, client); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token has been revoked"})
			return
		}

		// Get user from database
		userCollection := database.OpenCollection("users", client)
		var user models.User
		err = userCollection.FindOne(ctx, bson.M{"user_id": claims.UserId}).Decode(&user)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		// Generate new tokens
		newAccessToken, newRefreshToken, err := utils.GenerateAllTokens(user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
			return
		}

		// Update tokens in database (invalidates old refresh token)
		if err := utils.UpdateAllTokens(user.UserID, newAccessToken, newRefreshToken, client); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update tokens"})
			return
		}

		// Set new cookies
		c.SetCookie(
			"access_token",
			newAccessToken,
			3600*24, // 24 hours
			"/",
			"localhost",
			false,
			true,
		)

		c.SetCookie(
			"refresh_token",
			newRefreshToken,
			3600*24*7, // 7 days
			"/",
			"localhost",
			false,
			true,
		)

		c.JSON(http.StatusOK, gin.H{"message": "Token refreshed successfully"})
	}
}

// GetProfile returns the current user's profile (protected route example)
func GetProfile(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		// Get userId from context (set by AuthMiddleware)
		userId, err := utils.GetUserIdFromContext(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		// Get role from context
		role, err := utils.GetRoleFromContext(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Role not found"})
			return
		}

		// Fetch user from database
		userCollection := database.OpenCollection("users", client)
		var user models.User
		err = userCollection.FindOne(ctx, bson.M{"user_id": userId}).Decode(&user)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		// Return sanitized user data
		userResponse := models.UserResponse{
			UserID:          user.UserID,
			FirstName:       user.FirstName,
			LastName:        user.LastName,
			Email:           user.Email,
			Role:            role,
			FavouriteGenres: user.FavouriteGenres,
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Profile retrieved successfully",
			"user":    userResponse,
		})
	}
}
