const  { ApolloServer } = require('apollo-server');
const jwt = require('jsonwebtoken')
require('dotenv').config('variables.env')
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');

const conectarDB = require('./config/db');



//Vid 339,Conectar a la BD
conectarDB();

const server = new  ApolloServer({ 
    typeDefs, 
    resolvers,
    //Vid 350
    context: ({req}) => {
        // console.log( req.headers['authorization'] );
        //sino existe token sera vacio
        const token = req.headers['authorization'] || '';
        if(token) {
            try {
                //Vid 373 token.replace('Bearer ', '')
                const usuario = jwt.verify(token.replace('Bearer ', ''), process.env.SECRETA);
                console.log(usuario);
                return {
                    usuario
                }
            } catch (error) {
                console.log(error);
            }
        }
    }
});

server.listen({ port: process.env.PORT || 4000 }).then( ({url}) => {
    console.log(`Servidor listo en la URL ${url}`);
} )


