package main

import (
	"crypto/subtle"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
)

type Shift struct {
	WorkDate  string
	Names     string
	Starttime string `json:"starttime"`
	SysTime   string
	Endtime   string `json:"endtime"`
	Id        int    `json:"id"`
	WorkType  int
}

var (
	inMemStorage []Shift = []Shift{}
	lock         sync.RWMutex
)

func checkToken(ctx *gin.Context) {
	s := ctx.Request.Header.Get("secret")
	if subtle.ConstantTimeCompare([]byte(s), []byte(api_token)) == 0 {
		ctx.AbortWithStatus(http.StatusUnauthorized)
	}
}

func loadAnyRecords() error {
	result, err := db.Query("SELECT id, work_date, names, starttime, systime, endtime, worktype FROM shifts")
	if err != nil {
		return err
	}

	shifts := make([]Shift, 0)
	for result.Next() {
		var shift Shift
		err := result.Scan(&shift.Id, &shift.WorkDate, &shift.Names, &shift.Starttime, &shift.SysTime, &shift.Endtime, &shift.WorkType)
		if err != nil {
			return err
		}
		shifts = append(shifts, shift)
	}

	inMemStorage = shifts
	log.Default().Printf("[info] %v records loaded from sqlite\n", len(shifts))
	return nil
}

func onPostShifts(ctx *gin.Context) {
	request := []Shift{}

	if err := ctx.BindJSON(&request); err != nil {
		return
	}

	for index := range request {
		if strings.Contains(request[index].Names, whoami) {
			request[index].Names = "_yes_"
		} else {
			request[index].Names = "_no_"
		}
	}
	defer func() {
		err := saveShifts(request)
		if err != nil {
			log.Default().Println("[error] save to sqlite: ", err)
		}
	}()

	lock.Lock()
	defer lock.Unlock()
	inMemStorage = request
	ctx.String(http.StatusOK, "OK")
	log.Default().Println("[info] in-memory shifts updated")
}

func onGetShifts(ctx *gin.Context) {
	lock.RLock()
	defer lock.RUnlock()
	ctx.JSON(http.StatusOK, inMemStorage)
}
