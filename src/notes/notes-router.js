const path = require('path')
const express = require('express')
const notesService = require('./notes-service')

const notesRouter = express.Router()
const jsonParser = express.json()

const serializedNote = note => ({
    id: note.id,
    name: note.note_name,
    modified: note.modifield,
    content: note.content
})

notesRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        notesService.getAllNotes(knexInstance)
            .then(notes => {
                res.json(notes.map(serializedNote))
            })
            .catch(next)
    })
    
    .post(jsonParser, (req, res, next) => {
        const newNote = req.body

        for (const [key, value] of Object.entries(newNote))
            if (value == null)
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body`}
                })

        notesService.insertNote(
            req.app.get('db'),
            newNote
        )
        .then(note => {
            res
                .status(201)
                .location(path.posix.join(req.originalUrl, `/${note.id}`))
                .json(serializedNote(note))
        })
        .catch(next)
    })

notesRouter
    .route('/:note_id')
    .get((req, res, next) => {
        notesService.getById(
            req.app.get('db'),
            req.params.note_id
        )
        .then(note => {
            res.json(serializedNote(note))
        })
        .catch(next)
    })
    .delete((req, res, next) => {
        notesService.deleteNote(
            req.app.get('db'),
            req.params.note_id
          )
            .then(note => {
              res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const noteToUpdate = req.body
   
        const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length
         if (numberOfValues === 0) {
         return res.status(400).json({
           error: {
             message: 'note must have a name'
          }
        })
      }

      notesService.updateNote(
        req.app.get('db'),
        req.params.note_id,
        noteToUpdate
       )
         .then(note => {
           res.json(serializedNote(note))
         })
         .catch(next)
        })

module.exports = notesRouter