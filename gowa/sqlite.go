package main

import (
	"database/sql"
	"errors"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

func InitDB(dataSource string) {
	var err error
	db, err = sql.Open("sqlite3", dataSource)
	if err != nil {
		log.Fatal(err)
	}

	createTableSQL := `BEGIN;
	CREATE TABLE IF NOT EXISTS shifts (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		work_date TEXT,
		names TEXT,
		starttime TEXT,
		systime TEXT,
		endtime TEXT,
		worktype INTEGER
	);
	CREATE INDEX IF NOT EXISTS idx_work_date ON shifts (work_date);
	COMMIT;
	`

	_, err = db.Exec(createTableSQL)
	if err != nil {
		log.Fatal(err)
	}
}

func saveShifts(shifts []Shift) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			if rberr := tx.Rollback(); rberr != nil {
				err = errors.Join(err, rberr)
			}
		} else {
			tx.Commit()
		}
	}()

	_, err = tx.Exec("DELETE FROM shifts")
	if err != nil {
		return err
	}

	stmt, err := tx.Prepare("INSERT INTO shifts(work_date, names, starttime, systime, endtime, worktype) VALUES (?, ?, ?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()
	for _, shift := range shifts {
		_, err = stmt.Exec(shift.WorkDate, shift.Names, shift.Starttime, shift.SysTime, shift.Endtime, shift.WorkType)
		if err != nil {
			return err
		}
	}

	return err
}
