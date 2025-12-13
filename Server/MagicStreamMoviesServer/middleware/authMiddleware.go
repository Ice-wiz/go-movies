package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ice-wiz/MagicStreamMovies/Server/MagicStreamMoviesServer/utils"
)

// AuthMiddleware validates JWT access tokens and sets user info in context.
// It extracts the token from cookies, validates it, and stores userId and role in Gin context.
// If validation fails, it aborts the request with 401 Unauthorized.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract token from cookie
		token, err := utils.GetAccessToken(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No token provided"})
			c.Abort()
			return
		}

		// Check if token is empty
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token is empty"})
			c.Abort()
			return
		}

		// Validate token signature and expiration
		claims, err := utils.ValidateAccessToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Extract user info from claims
		userId := claims.UserId
		role := claims.Role

		// Store in context for handlers to use
		c.Set("userId", userId)
		c.Set("role", role) // Use "role" to match GetRoleFromContext

		// Continue to next handler
		c.Next()
	}
}
