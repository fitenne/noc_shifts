package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
)

func init() {
	log.Default().SetFlags(log.LstdFlags | log.Lshortfile)
}

func run() {
	InitDB("shifts.db")
	if err := loadAnyRecords(); err != nil {
		log.Default().Println("[warn] load from sqlite: ", err)
	}

	router := gin.Default()
	api_token = os.Getenv("GOWA_API_TOKEN")
	if api_token == "" {
		log.Fatalln("env GOWA_API_TOKEN needed")
	}
	whoami = os.Getenv("GOWA_WHOAMI")
	if whoami == "" {
		log.Fatalln("env GOWA_WHOAMI needed")
	}

	router.GET("/api/v1/shifts", onGetShifts)
	router.POST("/api/v1/shifts", checkToken, onPostShifts)

	if err := router.Run(apiListen); err != nil {
		log.Fatalln(err)
	}
}

func main() {
	gin.SetMode(gin.ReleaseMode)
	run()
}
