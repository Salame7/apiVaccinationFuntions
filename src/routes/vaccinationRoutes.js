const VaccinationController = require('../controllers/vaccinationController.js');
const UseConnection = require('../middlewares/UseConnection.js');
const validations = require('../middlewares/GeneralValidations.js');
const token = require('../middlewares/authenticate.js');
const express = require("express");
const checkTypeUser = require('../middlewares/checkTypeUser.js');
const limitAccess = require('../middlewares/limitAccess.js');
const api = express.Router();
// Te explico la estructura 
//          ruta                    milddlewares               |-función/metodo que se va aplicar a la ruta -|
//                      conexion a la base      validacion 
api.post('/registerVaccination/:_id/:tipo_vacuna/:dosis', [UseConnection.getPool, validations.registerValidationsVaccination, token.authenticateToken, checkTypeUser, limitAccess(1)],(req, res) => VaccinationController.registerVaccination(req, res));
api.put('/updateVaccination/:_id/:tipo_vacuna/:dosis', [UseConnection.getPool, validations.actualizacion_vacunacion, token.authenticateToken, checkTypeUser, limitAccess(1)],(req, res) => VaccinationController.updateVaccination(req, res));
api.get('/showVaccination/:_id/:tipo_vacuna/:dosis', [UseConnection.getPool, token.authenticateToken, checkTypeUser, limitAccess(1)], (req, res)=> VaccinationController.showVaccination(req, res));
api.get('/showVaccinationForCaregiver/:_id/:id_bebe/:tipo_vacuna/:dosis', [UseConnection.getPool, token.authenticateToken, checkTypeUser, limitAccess(2)], (req, res)=> VaccinationController.showVaccinationForCaregiver(req,res));
//api.delete('/deleteVaccination', [UseConnection.getPool, validations.deleteVaccination, token.authenticateToken], (req, res)=> VaccinationController.deleteVaccination(req, res));
module.exports = api;