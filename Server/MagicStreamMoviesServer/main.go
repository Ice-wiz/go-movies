package main

import (
	"context"
	"fmt"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	controller "github.com/ice-wiz/MagicStreamMovies/Server/MagicStreamMoviesServer/controllers"
	"github.com/ice-wiz/MagicStreamMovies/Server/MagicStreamMoviesServer/database"
	"github.com/ice-wiz/MagicStreamMovies/Server/MagicStreamMoviesServer/middleware"
)

func main() {

	var client = database.DBInstance()

	// Verify database connection
	if err := client.Ping(context.Background(), nil); err != nil {
		fmt.Println("Failed to reach MongoDB server:", err)
		return
	}
	fmt.Println("Successfully connected to MongoDB!")

	defer func() {
		if err := client.Disconnect(context.Background()); err != nil {
			fmt.Println("Error disconnecting from MongoDB:", err)
		}
	}()

	router := gin.Default()
	config := cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}
	router.Use(cors.New(config))

	router.GET("/hello", func(ctx *gin.Context) {
		ctx.String(200, "Welcome to MagicStream !")
	})

	// Public routes (no authentication required)
	router.POST("/register", controller.RegisterUser(client))
	router.POST("/login", controller.LoginUser(client))
	router.POST("/refresh", controller.RefreshToken(client))
	router.POST("/logout", controller.Logout(client)) // Public so logout works when access token expired (uses refresh cookie)
	router.GET("/movies", controller.GetMovies(client))
	router.GET("/genres", controller.GetGenres(client))

	// Protected routes (require authentication)
	protected := router.Group("/")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.GET("/profile", controller.GetProfile(client))
		protected.GET("/movie/:imdb_id", controller.GetMovie(client))
		protected.POST("/addmovie", controller.AddMovie(client))
		protected.GET("/recommendedmovies", controller.GetRecommendedMovies(client))
		protected.PATCH("/updatereview/:imdb_id", controller.AdminReviewUpdate(client))
	}

	fmt.Println("🚀 Server starting on http://localhost:8080")
	fmt.Println("📚 API Endpoints:")
	fmt.Println("  Public:")
	fmt.Println("    POST   /register  - User registration")
	fmt.Println("    POST   /login     - User login")
	fmt.Println("    POST   /refresh   - Refresh access token")
	fmt.Println("    POST   /logout    - Logout (uses refresh cookie if access token expired)")
	fmt.Println("    GET    /movies    - Get all movies")
	fmt.Println("    GET    /genres    - Get all genres")
	fmt.Println("  Protected (require authentication):")
	fmt.Println("    GET    /profile                  - Get user profile")
	fmt.Println("    GET    /movie/:imdb_id           - Get single movie")
	fmt.Println("    POST   /addmovie                 - Add movie")
	fmt.Println("    GET    /recommendedmovies        - Get recommended movies")
	fmt.Println("    PATCH  /updatereview/:imdb_id    - Update movie review (admin only)")

	if err := router.Run("localhost:8080"); err != nil {
		fmt.Println("failed to start server", err)
	}
}
