const Usuario = require('../models/Usuario');
const Proyecto = require('../models/Proyecto');
const Tarea = require('../models/Tarea');

const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({path: 'variables.env'});

// Vid 347,Crea y firma un JWT
const crearToken = (usuario, secreta, expiresIn) => {
    // console.log(usuario); Vid 373, nombre 
    const { id, email, nombre } = usuario;

    return jwt.sign( { id, email, nombre }, secreta, { expiresIn } );
}

//Vid 352 
const resolvers = {
    Query: {
        obtenerProyectos: async (_, {}, ctx) => {
            //traernos los proyectos de la persona actualizada 
            const proyectos = await Proyecto.find({ creador: ctx.usuario.id });

            return proyectos;
        },
        //Vid 357
        obtenerTareas: async (_, {input}, ctx) => {
            const tareas = await Tarea.find({ creador: ctx.usuario.id }).where('proyecto').equals(input.proyecto);

            return tareas;
        }
    }, 
    //Vid 342
    Mutation: {
        crearUsuario: async (_, {input}) => {
            const { email, password} = input;

            //Vid 344
            const existeUsuario = await Usuario.findOne({ email });

            //Vid 344,si el usuario existe
            if(existeUsuario) {
                throw new Error('El usuario ya esta registrado');
            }

            try {

                // Vid 345Hashear password
                const salt = await bcryptjs.genSalt(10);
                input.password = await bcryptjs.hash(password, salt);

                // VId 344, Registrar nuevo usuario
                const nuevoUsuario = new Usuario(input);
                // console.log(nuevoUsuario);

                nuevoUsuario.save();
                return "Usuario Creado Correctamente";
            } catch (error) {
                console.log(error);
            }
        },
         /***********************************************     AUTENTICAR   *************************************************************** */
        //Vid 346 
        autenticarUsuario:  async (_, {input}) => {
            const { email, password} = input;

            // Si el usuario existe
            const existeUsuario = await Usuario.findOne({ email });

            // si el usuario existe
            if(!existeUsuario) {
                throw new Error('El Usuario no existe');
            }

            // Si el password es correcto
            const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password);
            if(!passwordCorrecto) {
                throw new Error('Password Incorrecto');
            }

            //Vid 347, Dar acceso a la app
            return {
                token: crearToken(existeUsuario, process.env.SECRETA, '4hr' )
            }
        },

        /***********************************************     Nuevo Proyecto   *********************************************************** */

        //Vid 349 
        nuevoProyecto: async (_, {input}, ctx) => {
            try {
                const proyecto = new Proyecto(input);

                // asociar el creador
                proyecto.creador = ctx.usuario.id;

                // almacenarlo en la BD
                const resultado = await proyecto.save();

                return resultado;
            } catch (error) {
                console.log(error);
            }
        },

         /***********************************************   Actualizar Proyecto   ******************************************************** */

        //Vid 351 
        actualizarProyecto: async (_, {id, input}, ctx) => {
            // Revisar si el proyecto existe o no
            let proyecto = await Proyecto.findById(id);

            if(!proyecto) {
                throw new Error('Proyecto no encontrado');
            }

            // Revisar que si la persona que trata de editarlo, es el creador
            if(proyecto.creador.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales para editar');
            }

            // Guardar el proyecto
            proyecto = await Proyecto.findOneAndUpdate({ _id: id}, input, { new: true });
            return proyecto;
        },

         /***********************************************    Eliminar  Proyecto   *********************************************************** */

        eliminarProyecto: async (_, {id}, ctx) => {
            // Revisar si el proyecto existe o no
            let proyecto = await Proyecto.findById(id);

            if(!proyecto) {
                throw new Error('Proyecto no encontrado');
            }

            // Revisar que si la persona que trata de editarlo, es el creador
            if(proyecto.creador.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales para editar');
            }

            // Eliminar
            await Proyecto.findOneAndDelete({ _id : id });

            return "Proyecto Eliminado";

        },


         /***********************************************     Nueva tarea   *********************************************************** */
        //Vid 356
         nuevaTarea: async (_, {input}, ctx) => {
            try {
                const tarea = new Tarea(input);
                tarea.creador = ctx.usuario.id;
                const resultado = await tarea.save();
                return resultado;
            } catch (error) {
                console.log(error);
            }
        },

         /***********************************************    Actualizar Tarea  *********************************************************** */
        
        //Vid 356
         actualizarTarea: async (_, {id, input, estado}, ctx) => {
            // Si la tarea existe o no
            let tarea = await Tarea.findById( id );

            if(!tarea) {
                throw new Error('Tarea no encontrada');
            }

            // Si la persona que edita es el creador
            if(tarea.creador.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales para editar');
            }

            // asignar estado
            input.estado = estado;

            // Guardar y retornar la tarea
            tarea = await Tarea.findOneAndUpdate({ _id : id }, input, { new: true});

            return tarea;
        },


         /***********************************************     Eliminar Tarea  *********************************************************** */
        //Vid 358
         eliminarTarea: async (_, { id }, ctx) => {
            // Si la tarea existe o no
            let tarea = await Tarea.findById( id );

            if(!tarea) {
                throw new Error('Tarea no encontrada');
            }

            // Si la persona que edita es el creador
            if(tarea.creador.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales para editar');
            }

            // Eliminar
            await Tarea.findOneAndDelete({_id: id});

            return "Tarea Eliminada";
        }
    }
}

module.exports = resolvers;