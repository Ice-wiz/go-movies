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
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// GetMovies returns all movies (public)
func GetMovies(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		movieCollection := database.OpenCollection("movies", client)
		var movies []models.Movie
		cursor, err := movieCollection.Find(ctx, bson.M{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch movies"})
			return
		}
		defer cursor.Close(ctx)

		if err := cursor.All(ctx, &movies); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to decode movies"})
			return
		}

		c.JSON(http.StatusOK, movies)
	}
}

// GetMovie returns a single movie by imdb_id (protected)
func GetMovie(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		imdbID := c.Param("imdb_id")
		if imdbID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "imdb_id is required"})
			return
		}

		movieCollection := database.OpenCollection("movies", client)
		var movie models.Movie
		err := movieCollection.FindOne(ctx, bson.M{"imdb_id": imdbID}).Decode(&movie)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				c.JSON(http.StatusNotFound, gin.H{"error": "movie not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch movie"})
			return
		}

		c.JSON(http.StatusOK, movie)
	}
}

// AddMovie creates a new movie (protected; consider restricting to ADMIN in production)
func AddMovie(client *mongo.Client) gin.HandlerFunc {
	validate := validator.New()
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var movie models.Movie
		if err := c.ShouldBindJSON(&movie); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input", "details": err.Error()})
			return
		}

		if err := validate.Struct(movie); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
			return
		}

		movieCollection := database.OpenCollection("movies", client)
		result, err := movieCollection.InsertOne(ctx, movie)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add movie"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"message": "Movie added", "id": result.InsertedID})
	}
}

// GetGenres returns all genres from the genres collection (public).
// Used by the registration form so users can select favourite genres.
func GetGenres(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		genreCollection := database.OpenCollection("genres", client)
		cursor, err := genreCollection.Find(ctx, bson.M{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch genres"})
			return
		}
		defer cursor.Close(ctx)

		var genres []models.Genre
		if err := cursor.All(ctx, &genres); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode genres"})
			return
		}

		c.JSON(http.StatusOK, genres)
	}
}

// getUsersFavouriteGenres returns the favourite genre names for a user.
func getUsersFavouriteGenres(ctx context.Context, userId string, client *mongo.Client) ([]string, error) {
	userCollection := database.OpenCollection("users", client)
	var user struct {
		FavouriteGenres []models.Genre `bson:"favourite_genres" json:"favourite_genres"`
	}
	err := userCollection.FindOne(ctx, bson.M{"user_id": userId}, options.FindOne().SetProjection(bson.M{"favourite_genres.genre_name": 1})).Decode(&user)
	if err != nil {
		return nil, err
	}
	names := make([]string, 0, len(user.FavouriteGenres))
	for _, g := range user.FavouriteGenres {
		names = append(names, g.GenreName)
	}
	return names, nil
}

// GetRecommendedMovies returns movies matching the current user's favourite genres, sorted by ranking (protected)
func GetRecommendedMovies(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		userId, err := utils.GetUserIdFromContext(c)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "User not authenticated"})
			return
		}

		genreNames, err := getUsersFavouriteGenres(ctx, userId, client)
		if err != nil || len(genreNames) == 0 {
			c.JSON(http.StatusOK, []models.Movie{}) // empty list if no genres or user not found
			return
		}

		movieCollection := database.OpenCollection("movies", client)
		opts := options.Find().SetSort(bson.D{{Key: "ranking.ranking_value", Value: 1}}).SetLimit(10)
		filter := bson.M{"genre.genre_name": bson.M{"$in": genreNames}}
		cursor, err := movieCollection.Find(ctx, filter, opts)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recommended movies"})
			return
		}
		defer cursor.Close(ctx)

		var movies []models.Movie
		if err := cursor.All(ctx, &movies); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode movies"})
			return
		}

		c.JSON(http.StatusOK, movies)
	}
}

// AdminReviewUpdate updates a movie's admin_review and ranking (protected, ADMIN only).
// Body: { "admin_review": "string", "ranking": { "ranking_value": int, "ranking_name": "string" } }.
// ranking is optional; if omitted, ranking is set to Unrated (999).
func AdminReviewUpdate(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		role, err := utils.GetRoleFromContext(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}
		if role != models.RoleAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin role required"})
			return
		}

		imdbID := c.Param("imdb_id")
		if imdbID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "imdb_id is required"})
			return
		}

		var req struct {
			AdminReview string          `json:"admin_review"`
			Ranking     *models.Ranking `json:"ranking"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
			return
		}
		if req.AdminReview == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "admin_review is required"})
			return
		}

		ranking := models.Ranking{RankingValue: 999, RankingName: "Unrated"}
		if req.Ranking != nil {
			ranking = *req.Ranking
		}

		movieCollection := database.OpenCollection("movies", client)
		filter := bson.M{"imdb_id": imdbID}
		update := bson.M{
			"$set": bson.M{
				"admin_review": req.AdminReview,
				"ranking": bson.M{
					"ranking_value": ranking.RankingValue,
					"ranking_name":  ranking.RankingName,
				},
			},
		}
		result, err := movieCollection.UpdateOne(ctx, filter, update)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update movie"})
			return
		}
		if result.MatchedCount == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Movie not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message":      "Review updated",
			"admin_review": req.AdminReview,
			"ranking":      ranking,
		})
	}
}
