// IMPORTAR
const fileSystem = require('fs');
const process = require('process');
// Librería express
const express = require('express');
// Parcear el body de la llamada
const parser = require('body-parser');
// Función para generar hash
const bcrypt = require('bcrypt');
// Obtener un json web token
const jwt = require('jsonwebtoken');
// Obtiene y compara el header de web token
const jwtHeader = require('express-jwt');
// Pone colors en la consola
const colors = require('colors');
// Peticiones MongoDB
const mongo = require('mongodb');

// Variable para hacer mix con el username (TOKEN)
let jwtClaveRaw = fileSystem.readFileSync('secrets.json');
let jwtClave = JSON.parse(jwtClaveRaw);
let miClave = jwtClave["jwt_key"];

// Creación de la app server
const server = express();

// Cliente de MongoDB
const mongoClient = mongo.MongoClient;

// Tema Cors
const cors = require('cors');

// CONFIGURACIÓN MIDDLEWARE
// Asegurar tema headers
let allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.sendStatus(200);
    } else {
        next();
    }
};
server.use(allowCrossDomain);

//Cors
server.use(cors());

// Parcear la el body de las llamadas
server.use(parser.json());

// sistema para indicar si utilizamos o no AUTENTIFICACIÓN
if (process.argv[2] != "dev") {
    server.use(jwtHeader({
        secret: miClave
    }).unless({
        path: ['/newuser', '/login', '/newbooking']
    }));
}

// Settings port para Heroku
server.set('port', process.env.PORT || 3000);

//AUTENTIFICACIÓN
var secretRaw = fileSystem.readFileSync('secrets.json');
var secrets = JSON.parse(secretRaw);

//Conexión a Mongo
// mongoClient ejecuta la función que engloba todo el código de las llamadas
mongoClient.connect(secrets['atlasUrl'], {
    useUnifiedTopology: true,
    useNewUrlParser: true
    // Aquí comienza la ejecución de las llamadas una vez realizada la conexión (callback)
}, function (err, mongoConnection) {
    if (err) {
        throw err;
    }
    console.log("Conectado a Mongo");
    var db = mongoConnection.db('motor-reservas');
    console.log('Database abierta');

    // Llamada POST para crear un nuevo user
    server.post('/newuser', function (req, res) {
        db.collection('users').find({
            userName: req.body.userName
        }).toArray(function (err, result) {
            console.log(result);
            // Comprobamos si el usuario ya existe en el array que se obtiene con result
            if (result.length >= 1) {
                res.send({
                    "message": "el nombre de usuario solicitado ya existe"
                });
            } else {
                var newRandomID = mongo.ObjectId();
                let hash = bcrypt.hashSync(req.body.userPassword, 10);
                var newDocument = {
                    "_id": newRandomID,
                    "userName": req.body.userName,
                    "userPassword": hash
                }
                db.collection('users').insertOne(newDocument, function (err, result) {
                    if (err) {
                        throw err;
                    }
                    res.send(newDocument);
                    console.log(newDocument);
                });
            }
        })
    })

    // Llamada POST para acceder como superAdmin
    server.post('/login', function (req, res) {

        db.collection('users').find({
            "userName": req.body.userName
        }).toArray(function (err, result) {
            console.log(result);

            if (result.length == 0) {
                res.send({
                    "message": "Wrong user"
                })
            } else {
                let passwordExist = false;
                console.log(`Intentando acceder el usuario ${result[0]["userName"]}`.yellow);
                if (bcrypt.compareSync(req.body.userPassword, result[0]["userPassword"])) {
                    passwordExist = true;
                }
                if (passwordExist == true) {
                    let token = jwt.sign({
                        userPassword: req.body.userPassword
                    }, miClave);
                    console.log(`El usuario ${result[0]["userName"]} ha accedido`.yellow);
                    console.log(`Token: ${token}`.red);
                    res.send({
                        "token": token,
                        "user": result[0]["userName"]
                    });
                } else {
                    res.send({
                        "message": "Wrong password"
                    })
                }
            }
        })
    })

    //Llamada GET para visualizar todas las reservas
    server.get('/booking', function (req, res) {
        db.collection('reservas').find().toArray(function (err, result) {
            if (err) {
                throw err;
            }
            res.send(result);
        });
    });

    //Llamada GET para visualizar todas las reservas solo ADMIN
    server.get('/adminbooking', function (req, res) {
        db.collection('reservas').find().toArray(function (err, result) {
            if (err) {
                throw err;
            }
            res.send(result);
        });
    });

    // Petición GET de una única reserva solo ADMIN
    server.get('/booking/:id', function (req, res) {
        db.collection('reservas').find({
            "_id": mongo.ObjectId(req.params.id)
        }).toArray(function (err, result) {
            if (err) {
                throw err;
            }
            res.send(result[0]);
        })
    })

    // Llamada POST para crear una nueva reserva
    server.post('/newbooking', function (req, res) {
        // Función que pasa los datos de mail y nombre para registrarlos en mailchimp
        addMailchimpPendingList(
            req.body.bookingMail, 
            req.body.bookingFullName,
            req.body.bookingPhone, 
            req.body.bookingArrival, 
            req.body.bookingDeparture,
            req.body.bookingVilla
            );
        var newRandomID = mongo.ObjectId();
        var newDocument = {
            "_id": newRandomID,
            "bookingFullName": req.body.bookingFullName,
            "bookingMail": req.body.bookingMail,
            "bookingPhone": req.body.bookingPhone,
            "bookingArrival": req.body.bookingArrival,
            "bookingDeparture": req.body.bookingDeparture,
            "bookingVilla": req.body.bookingVilla,
            "bookingGuests": req.body.bookingGuests,
            "bookingComments": req.body.bookingComments,
            "bookingPayment": false,
            "bookingApproved": false,
            "bookingStored": false
        }
        db.collection('reservas').insertOne(newDocument, function (err, result) {
            if (err) {
                throw err;
            }
            console.log(`Se ha creado una nueva reserva`.green);
            res.send(newDocument);
        });
    });

    // Llamada PUT para editar una reserva especificada por el ID
    server.put('/editbooking', function (req, res) {
        // Si cambiamos el valor Payment a true lanzamos el mail pendiente de pago
        if (req.body.bookingPayment == true) {
            addMailchimpPaymentTag(req.body.bookingMail);
        } else {
            deleteMailchimpPaymentTag(req.body.bookingMail);
        }
        // Si cambiamos el valor Approved a true lanzamos el mail Reserva aprobada
        if (req.body.bookingApproved == true) {
            addMailchimpApprovedTag(req.body.bookingMail);
        } else {
            deleteMailchimpApprovedTag(req.body.bookingMail);
        }
        // Si cambiamos el valor Stored a true lanzamos el mail Gracias por su visita
        if (req.body.bookingStored == true) {
            addMailchimpStoredTag(req.body.bookingMail);
        } else {
            deleteMailchimpStoredTag(req.body.bookingMail);
        }
        var newDocument = {
            $set: {
                "bookingFullName": req.body.bookingFullName,
                "bookingMail": req.body.bookingMail,
                "bookingPhone": req.body.bookingPhone,
                "bookingArrival": req.body.bookingArrival,
                "bookingDeparture": req.body.bookingDeparture,
                "bookingVilla": req.body.bookingVilla,
                "bookingGuests": req.body.bookingGuests,
                "bookingComments": req.body.bookingComments,
                "bookingPayment": req.body.bookingPayment,
                "bookingApproved": req.body.bookingApproved,
                "bookingStored": req.body.bookingStored
            }
        }
        db.collection('reservas').updateOne({
            "_id": mongo.ObjectId(req.body._id)
        }, newDocument, function (err, result) {
            if (err) {
                throw err;
            }
            newDocument["$set"]["_id"] = req.body._id;
            res.send(newDocument["$set"]);
        });
    });

    // Llamada DELETE para borrar a una reserva especificada por el ID
    server.delete('/booking/:id', function (req, res) {
        db.collection('reservas').deleteOne({
            "_id": mongo.ObjectId(req.params.id)
        }, function (err, result) {
            if (err) {
                throw err;
            }
            console.log(`La reserva ${req.params.id} ha sido eliminada`.red);
            res.send({
                'message': "Booking deleted"
            });
        });
    });

    //Pongo el server a escuchar para Heroku
    server.listen(server.get('port'), () => {
        console.log(`server on port ${server.get('port')}`);
    });

    // Pongo server a escuchar
    /*console.log("Escuchando en puerto 3000 sin Heroku");
    server.listen(3000);*/
    // Cerramos el server de ejecución de llamadas
});

// Función para enviar datos a la lista Pending Aprroval de Mailchimp
function addMailchimpPendingList(mail, name, phone, arrival, departure, villa) {
    var request = require("request");
    // Construir estructura datos del body requerida por la API de mailchimp
    const data = {
            email_address: mail,
            status: "subscribed",
            merge_fields: {
                FNAME: name,
                PHONE: phone,
                ARRIVAL: arrival,
                DEPARTURE: departure,
                VILLA: villa
            },
            // Añadimos el tag Pending para lanzar el mail de recepción de la reserva
            tags: ["pending"]
    }
    // Cambiar los datos de data (body) a JSON
    const postData = JSON.stringify(data);
    var options = {
        url: 'https://us20.api.mailchimp.com/3.0/lists/c59d364873/members',
        method: 'POST',
        headers: {
            Authorization: 'auth 228de32d7367405475636fd0c34f9632-us20',
        },
        body: postData
    };
    request(options, (error, response, body) => {
        if (error) {
            throw new Error(error);
        } else {
            if (response.statusCode === 200) {
                console.log(data);
            } else if (response.statusCode === 400) {
                console.log(response.body);
            }
        }
    });
}

// Función para añadir el tag Payment a la lista de Mailchimp
function addMailchimpPaymentTag(mail) {
    var request = require("request");
    // Construir estructura datos del body requerida por la API de mailchimp
    const data = {
        email_address: mail
    }
    // Cambiar los datos de data (body) a JSON
    const postData = JSON.stringify(data);
    var options = {
        // id segment tag Approved = 107388
        url: 'https://us20.api.mailchimp.com/3.0/lists/c59d364873/segments/107388/members',
        method: 'POST',
        headers: {
            Authorization: 'auth 228de32d7367405475636fd0c34f9632-us20',
        },
        body: postData
    };
    request(options, (error, response, body) => {
        if (error) {
            throw new Error(error);
        } else {
            if (response.statusCode === 200) {
                console.log(`Tag PAYMENT ${postData}`.yellow);
            } else if (response.statusCode === 400) {
                console.log(response.body);
            }
        }
    });
}

// Función para eliminar el tag Payment a la lista de Mailchimp
function deleteMailchimpPaymentTag(mail) {
    const request = require("request");
    // Construir estructura datos del body requerida por la API de mailchimp
    let options = {
        url: `https://us20.api.mailchimp.com/3.0/lists/c59d364873/members/${mail}`,
        method: 'GET',
        headers: {
            Authorization: 'auth 228de32d7367405475636fd0c34f9632-us20',
        }
    };
    request(options, (error, response, body) => {
        if (error) {
            throw new Error(error);
        } else {
            // Obtenemos la respuesta en formato JSON y lo convertimos a objeto con JSON.parse para poder acceder a sus datos
             const rawData = JSON.parse(response.body);
             const id = rawData.id;
            executeDelete(id);
        }
    });
    function executeDelete(id) {
        const request = require("request");
        let options = {
            // id segment tag Approved = 107388
            url: `https://us20.api.mailchimp.com/3.0/lists/c59d364873/segments/107388/members/${id}`,
                method: 'DELETE',
                headers: {
                    Authorization: 'auth 228de32d7367405475636fd0c34f9632-us20',
                }
        };
        request(options, (error, response, body) => {
            if (error) {
                throw new Error(error);
            } else {
                console.log(`Tag PAYMENT DELETED ${mail}`.red)
            }
        })
    }
}

// Función para añadir el tag Approved a la lista de Mailchimp
function addMailchimpApprovedTag(mail) {
    var request = require("request");
    // Construir estructura datos del body requerida por la API de mailchimp
    const data = {
        email_address: mail
    }
    // Cambiar los datos de data (body) a JSON
    const postData = JSON.stringify(data);
    var options = {
        // id segment tag Approved = 107392
        url: 'https://us20.api.mailchimp.com/3.0/lists/c59d364873/segments/107392/members',
        method: 'POST',
        headers: {
            Authorization: 'auth 228de32d7367405475636fd0c34f9632-us20',
        },
        body: postData
    };
    request(options, (error, response, body) => {
        if (error) {
            throw new Error(error);
        } else {
            if (response.statusCode === 200) {
                console.log(`Tag APPROVED ${postData}`.green);
            } else if (response.statusCode === 400) {
                console.log(response.body);
            }
        }
    });
}

// Función para eliminar el tag Approved a la lista de Mailchimp
function deleteMailchimpApprovedTag(mail) {
    const request = require("request");
    // Construir estructura datos del body requerida por la API de mailchimp
    let options = {
        url: `https://us20.api.mailchimp.com/3.0/lists/c59d364873/members/${mail}`,
        method: 'GET',
        headers: {
            Authorization: 'auth 228de32d7367405475636fd0c34f9632-us20',
        }
    };
    request(options, (error, response, body) => {
        if (error) {
            throw new Error(error);
        } else {
            // Obtenemos la respuesta en formato JSON y lo convertimos a objeto con JSON.parse para poder acceder a sus datos
            const rawData = JSON.parse(response.body);
            const id = rawData.id;
            executeDelete(id);
        }
    });

    function executeDelete(id) {
        const request = require("request");
        let options = {
            // El id 107392 pertece al tag (segment) Approved
            url: `https://us20.api.mailchimp.com/3.0/lists/c59d364873/segments/107392/members/${id}`,
            method: 'DELETE',
            headers: {
                Authorization: 'auth 228de32d7367405475636fd0c34f9632-us20',
            }
        };
        request(options, (error, response, body) => {
            if (error) {
                throw new Error(error);
            } else {
                console.log(`Tag APPROVED DELETED ${mail}`.red)
            }
        })
    }
}

// Función para añadir el tag Stored a la lista de Mailchimp
function addMailchimpStoredTag(mail) {
    var request = require("request");
    // Construir estructura datos del body requerida por la API de mailchimp
    const data = {
        email_address: mail
    }
    // Cambiar los datos de data (body) a JSON
    const postData = JSON.stringify(data);
    var options = {
        // id segment tag Stored = 107396
        url: 'https://us20.api.mailchimp.com/3.0/lists/c59d364873/segments/107396/members',
        method: 'POST',
        headers: {
            Authorization: 'auth 228de32d7367405475636fd0c34f9632-us20',
        },
        body: postData
    };
    request(options, (error, response, body) => {
        if (error) {
            throw new Error(error);
        } else {
            if (response.statusCode === 200) {
                console.log(`Tag STORED ${postData}`.blue);
            } else if (response.statusCode === 400) {
                console.log(response.body);
            }
        }
    });
}

// Función para eliminar el tag Stored a la lista de Mailchimp
function deleteMailchimpStoredTag(mail) {
    const request = require("request");
    // Construir estructura datos del body requerida por la API de mailchimp
    let options = {
        url: `https://us20.api.mailchimp.com/3.0/lists/c59d364873/members/${mail}`,
        method: 'GET',
        headers: {
            Authorization: 'auth 228de32d7367405475636fd0c34f9632-us20',
        }
    };
    request(options, (error, response, body) => {
        if (error) {
            throw new Error(error);
        } else {
            // Obtenemos la respuesta en formato JSON y lo convertimos a objeto con JSON.parse para poder acceder a sus datos
            const rawData = JSON.parse(response.body);
            const id = rawData.id;
            executeDelete(id);
        }
    });

    function executeDelete(id) {
        const request = require("request");
        let options = {
            // id segment tag Stored = 107396
            url: `https://us20.api.mailchimp.com/3.0/lists/c59d364873/segments/107396/members/${id}`,
            method: 'DELETE',
            headers: {
                Authorization: 'auth 228de32d7367405475636fd0c34f9632-us20',
            }
        };
        request(options, (error, response, body) => {
            if (error) {
                throw new Error(error);
            } else {
                console.log(`Tag STORED DELETED ${mail}`.red)
            }
        })
    }
}
