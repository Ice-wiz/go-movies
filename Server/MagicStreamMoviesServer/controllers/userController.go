package controllers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/ice-wiz/MagicStreamMovies/Server/MagicStreamMoviesServer/database"
	"github.com/ice-wiz/MagicStreamMovies/Server/MagicStreamMoviesServer/models"
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
		ctx, cancel := context.WithTimeout(context.Background(), 1000*time.Millisecond)
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

		// 5. Generate UserID and set defaults
		oid := bson.NewObjectID()
		user.ID = oid
		user.UserID = oid.Hex()
		user.CreatedAt = time.Now()
		user.UpdatedAt = time.Now()
		user.Password = hashedPassword // Replace plain password with hash
		user.Role = models.RoleUser    // Default role

		// 6. Insert user into database
		result, err := userCollection.InsertOne(ctx, user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}

		// 7. Return success response
		c.JSON(http.StatusCreated, gin.H{
			"message": "User registered successfully",
			"user_id": user.UserID,
			"id":      result.InsertedID,
		})
	}
}
