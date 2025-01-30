const MongoConnection = require("../middlewares/connection.js");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb").ObjectId;

module.exports = (() => {
  class Vacunacion {
    async registerVaccination(req, res) {
      try {
        let { _id, tipo_vacuna, dosis } = req.params;
        let { edad_vacuna, fecha, lugar_inyeccion, lugar, notas } = req.body;

        // Obtener el usuario por su ID
        let vacuna = await req.db
          .collection("alumno")
          .aggregate([
            {
              $match: { _id: new mongoose.Types.ObjectId(_id) },
            },
          ])
          .toArray();

        let user = vacuna[0];
        if (!user || !user.bebes || !user.bebes[0] || !user.bebes[0].vacunas) {
          return res.status(404).send({
            successful: false,
            error: true,
            message: "Usuario o vacunas no encontrados",
          });
        }

        // Definir el límite de dosis por tipo de vacuna
        const dosisLimite = {
          1: 1, // BCG, Tuberculosis
          2: 3, // Hepatitis B
          3: 3, // Pentavalente
          4: 3, // Rotavirus
          5: 3, // Neumococo
          6: 2, // Influenza
        };

        // Verificar si el tipo de vacuna es válido
        if (!dosisLimite.hasOwnProperty(tipo_vacuna)) {
          return res.status(400).send({
            successful: false,
            error: true,
            message: "Tipo de vacuna no válido",
          });
        }

        // Contar el número de dosis actuales del tipo de vacuna
        const currentDoses = user.bebes[0].vacunas.filter(
          (v) => v.tipo_vacuna === tipo_vacuna
        ).length;

        // Verificar si se ha alcanzado el límite de dosis
        if (currentDoses >= dosisLimite[tipo_vacuna]) {
          return res.status(400).send({
            successful: false,
            error: true,
            message: `Se ha alcanzado el límite de dosis para la vacuna tipo ${tipo_vacuna}`,
          });
        }

        let data_vacuna = {
          _id: new mongoose.Types.ObjectId(),
          tipo_vacuna: tipo_vacuna,
          dosis: dosis,
          edad_vacuna: edad_vacuna,
          fecha: new Date(fecha),
          lugar_inyeccion: lugar_inyeccion,
          lugar: lugar,
          notas: notas,
        };

        user.bebes[0].vacunas.push(data_vacuna);

        let update_vacuna = await req.db.collection("alumno").updateOne(
          { _id: new mongoose.Types.ObjectId(_id) },
          {
            $set: user,
          }
        );

        return res.status(200).send({
          successful: true,
          message: update_vacuna,
        });
      } catch (error) {
        console.error(error.message);
        return res.status(401).send({
          successful: false,
          error: true,
          message: "Algo salió mal con el registro de vacunas",
        });
      } finally {
        await MongoConnection.releasePool(req.db);
      }
    }

    async updateVaccination(req, res) {
      try {
        let { _id, tipo_vacuna, dosis } = req.params;
        let { _id_vacunas, edad_vacuna, fecha, lugar_inyeccion, lugar, notas } =
          req.body;

        //let { email, password } = req.body; es lo mismo que las lineas anteriores
        let users = await req.db
          .collection("alumno")
          .aggregate([
            {
              $match: {
                _id: new mongoose.Types.ObjectId(_id),
                // _id: new ObjectId(_id)
              },
            },
          ])
          .toArray();

        let user = users[0];
        //console.log("vacunas");
        //console.log(JSON.stringify(user));
        //console.log(user)

        //for(let bebe of user.bebes){
        for (let vacunas of user.bebes[0].vacunas) {
          //console.log(vacunas);
          if (vacunas._id.toString() == _id_vacunas.toString()) {
            tipo_vacuna ? (vacunas.tipo_vacuna = tipo_vacuna) : null;
            dosis ? (vacunas.dosis = dosis) : null;
            edad_vacuna ? (vacunas.edad_vacuna = edad_vacuna) : null;
            fecha
              ? (vacunas.fecha = new Date(fecha))
              : (vacunas.fecha = new Date());
            lugar_inyeccion
              ? (vacunas.lugar_inyeccion = lugar_inyeccion)
              : null;
            lugar ? (vacunas.lugar = lugar) : null;
            notas ? (vacunas.notas = notas) : null;
          }
        }

        let update_vacunas = await req.db.collection("alumno").updateOne(
          { _id: new mongoose.Types.ObjectId(_id) },
          {
            $set: user,
          }
        );

        //console.log(update_vacunas);
        //console.log("entrando a la funcion update de los bebes");

        return res.status(200).send({
          successful: true,
          message: update_vacunas,
        });
      } catch (error) {
        console.error(error.message);
        return res.status(401).send({
          successful: false,
          error: true,
          message: "Algo salio mal con el registro del bebe",
        });
      } finally {
        //Terminamos la sesión con la BD
        await MongoConnection.releasePool(req.db);
      }
    }

    async showVaccination(req, res) {
      try {
        let { _id, tipo_vacuna, dosis } = req.params;

        let data = await req.db
          .collection("alumno")
          .aggregate([
            {
              $match: { _id: new mongoose.Types.ObjectId(_id) },
            },
          ])
          .toArray();

        let user = data[0];

        if (!user) {
          return res.status(404).send({
            success: false,
            error: true,
            message: "Usuario no encontrado",
          });
        }

        // Verificar si el usuario tiene datos de bebes y vacunas
        if (!user.bebes || !user.bebes[0] || !user.bebes[0].vacunas) {
          return res.status(404).send({
            success: false,
            error: true,
            message: "Datos de vacunación no encontrados",
          });
        }

        // Filtrar los datos de vacunación por tipo de vacuna y dosis
        let vaccinationData = user.bebes[0].vacunas.filter(
          (v) => v.tipo_vacuna == tipo_vacuna && v.dosis == dosis
        );

        // Omitir los campos tipo_vacuna y dosis
        vaccinationData = vaccinationData.map((v) => {
          const { tipo_vacuna, dosis, ...resto } = v;
          return resto;
        });

        return res.status(200).send({
          success: true,
          data: vaccinationData,
        });
      } catch (error) {
        console.error(
          "Error al obtener los datos de vacunación:",
          error.message
        );
        return res.status(500).send({
          success: false,
          error: true,
          message: "Algo salió mal al obtener los datos de vacunación",
        });
      } finally {
        // Terminar la conexión con la BD
        await MongoConnection.releasePool(req.db);
      }
    }

    async showVaccinationForCaregiver(req, res) {
      try {
        let { id_bebe, tipo_vacuna, dosis } = req.params;

        let data = await req.db
          .collection("alumno")
          .aggregate([
            {
              $match: { _id: new mongoose.Types.ObjectId(id_bebe) },
            },
          ])
          .toArray();

        let user = data[0];

        if (!user) {
          return res.status(404).send({
            success: false,
            error: true,
            message: "Usuario no encontrado",
          });
        }

        // Verificar si el usuario tiene datos de bebes y vacunas
        if (!user.bebes || !user.bebes[0] || !user.bebes[0].vacunas) {
          return res.status(404).send({
            success: false,
            error: true,
            message: "Datos de vacunación no encontrados",
          });
        }

        // Filtrar los datos de vacunación por tipo de vacuna y dosis
        let vaccinationData = user.bebes[0].vacunas.filter(
          (v) => v.tipo_vacuna == tipo_vacuna && v.dosis == dosis
        );

        // Omitir los campos tipo_vacuna y dosis
        vaccinationData = vaccinationData.map((v) => {
          const { tipo_vacuna, dosis, ...resto } = v;
          return resto;
        });

        return res.status(200).send({
          success: true,
          data: vaccinationData,
        });
      } catch (error) {
        console.error(
          "Error al obtener los datos de vacunación:",
          error.message
        );
        return res.status(500).send({
          success: false,
          error: true,
          message: "Algo salió mal al obtener los datos de vacunación",
        });
      } finally {
        // Terminar la conexión con la BD
        await MongoConnection.releasePool(req.db);
      }
    }

    async deleteVaccination(req, res) {
      try {
        let { _id, _id_vacunas } = req.body;
        //console.log(_id);
        //console.log(_id_vacunas);
        // Obtener el usuario por su ID
        let vacuna = await req.db
          .collection("alumno")
          .aggregate([
            {
              $match: { _id: new mongoose.Types.ObjectId(_id) },
            },
          ])
          .toArray();

        let user = vacuna[0];
        if (!user || !user.bebes || !user.bebes[0] || !user.bebes[0].vacunas) {
          return res.status(404).send({
            successful: false,
            error: true,
            message: "Usuario o vacunas no encontrados",
          });
        }

        // Encontrar el índice del registro de vacunación a eliminar
        const vacunaIndex = user.bebes[0].vacunas.findIndex(
          (v) => v._id.toString() === _id_vacunas
        );

        // Verificar si se encontró el registro de vacunación
        if (vacunaIndex === -1) {
          return res.status(404).send({
            successful: false,
            error: true,
            message: "Registro de vacunación no encontrado",
          });
        }

        // Eliminar el registro de vacunación
        user.bebes[0].vacunas.splice(vacunaIndex, 1);

        // Actualizar el documento del usuario en la base de datos
        let update_vacuna = await req.db.collection("alumno").updateOne(
          { _id: new mongoose.Types.ObjectId(_id) },
          {
            $set: user,
          }
        );

        return res.status(200).send({
          successful: true,
          message: "Registro de vacunación eliminado con éxito",
          data: update_vacuna,
        });
      } catch (error) {
        console.error(error.message);
        return res.status(500).send({
          successful: false,
          error: true,
          message: "Algo salió mal al eliminar el registro de vacunación",
        });
      } finally {
        await MongoConnection.releasePool(req.db);
      }
    }
  }
  return new Vacunacion();
})();
