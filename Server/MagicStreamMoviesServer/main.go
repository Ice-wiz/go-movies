package main

import (
	"context"
	"fmt"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	controller "github.com/ice-wiz/MagicStreamMovies/Server/MagicStreamMoviesServer/controllers"
	"github.com/ice-wiz/MagicStreamMovies/Server/MagicStreamMoviesServer/database"
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

	router.GET("/movies", controller.GetMovies())

	if err := router.Run("localhost:8080"); err != nil {
		fmt.Println("failed to start server", err)
	}
}
