const path = require('path')
const express = require('express')
const FolderService = require('./folders-service')

const foldersRouter = express.Router()
const jsonParser = express.json()

const serializedFolder = folder => ({
    id: folder.id,
    name: folder.name
})
foldersRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        FolderService.getAllFolders(knexInstance)
            .then(folders => {
                res.json(folders.map(serializedFolder))
            })
            .catch(next)
    })
    
    .post(jsonParser, (req, res, next) => {
        const newFolder = req.body

        for (const [key, value] of Object.entries(newFolder))
            if (value == null)
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body`}
                })

        FolderService.insertFolder(
            req.app.get('db'),
            newFolder
        )
        .then(folder => {
            res
                .status(201)
                .location(path.posix.join(req.originalUrl, `/${folder.id}`))
                .json(serializedFolder(folder))
        })
        .catch(next)
    })

foldersRouter
    .route('/:folder_id')
    .all((req, res, next) => {
        FolderService.getbyId(
            req.app.get('db'),
            req.params.folder_id
        )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializedFolder(res.folder))
    })
    .delete((req, res, next) => {
        FoldersService.deleteFolder(
            req.app.get('db'),
            req.params.folder_id
          )
            .then(numRowsAffected => {
              res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const folderToUpdate = req.body
   
        const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length
         if (numberOfValues === 0) {
         return res.status(400).json({
           error: {
             message: 'Folder must have a name'
          }
        })
      }

      FoldersService.updateFolder(
        req.app.get('db'),
        req.params.folder_id,
        folderToUpdate
       )
         .then(numRowsAffected => {
           res.status(204).end()
         })
         .catch(next)
        })