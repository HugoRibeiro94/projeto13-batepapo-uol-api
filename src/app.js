import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

// criando a aplicação servidora
const app = express();

// configurações
app.use(cors());
app.use(express.json());
dotenv.config();

// conectando ao banco
const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient.connect()
	.then(() => db = mongoClient.db())
	.catch((err) => console.log(err.message))

// funções/rotas (Endpoint)

app.get("/participants", (req, res) => {
	// buscando participants
	db.collection("participants").find().toArray()
		.then(participants => res.send(participants))  // array de participants
		.catch(err => res.status(500).send(err.message))  // mensagem de erro
});

app.post("/participants", (req, res) => {
	// inserindo participants
    const {name, lastStatus} = req.body;

    const newParticipants = {
        name: name,
        lastStatus: lastStatus
    }

	db.collection("participants").insertOne(newParticipants)
        .then(participants => res.send(participants))
		.catch(err => console.log(err.message))
});

app.get("/message", (req, res) => {
	// buscando message
	db.collection("message").find().toArray()
		.then(message => res.send(message))  // array de message
		.catch(err => res.status(500).send(err.message))  // mensagem de erro
});

app.post("/message", (req, res) => {
	// inserindo message

    const {from, to, text, type, time} = req.body;

    const newMessage = {
        from: from, 
        to: to, 
        text: text, 
        type: type, 
        time: time
    }
    
	db.collection("message").insertOne(newMessage)
		.then(message => res.send(message))  // array de message
		.catch(err => res.status(500).send(err.message))  // mensagem de erro
});

app.get("/", (request, response) => {
    response.send("Executando..");
})

// rodando a aplicação servidora para ouvir requisições na porta 5000
const PORT = 5000;
app.listen( PORT, () => console.log(`Server running at port ${PORT}`))