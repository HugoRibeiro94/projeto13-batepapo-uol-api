import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import Joi from 'joi';

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

const participantsSchema = Joi.object({ name: Joi.string().required() })

app.post("/participants", async (req, res) => {
	// inserindo participants
    const {name} = req.body;

	const validation = participantsSchema.validate(req.body, { abortEarly: false })

	if (validation.error){
		const errors = validation.error.details.map(det => det.message)
		return res.status(422).send(errors)
	}

    const newParticipants = { name, lastStatus: Date.now()}

	try {
		const existRegister = await db.collection("participants").findOne({name})
		if (existRegister) return res.status(409).send("Participante já cadastrado")

		await db.collection("participants").insertOne(newParticipants)
		res.status(201).send(newParticipants)
	} catch (err){ 
		res.status(500).send(err.message)
	}
	
	
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
		.then(message => res.status(201).send(message))  // array de message
		.catch(err => res.status(500).send(err.message))  // mensagem de erro
});

app.get("/", (request, response) => {
    response.send("Executando..");
})

// rodando a aplicação servidora para ouvir requisições na porta 5000
const PORT = 5000;
app.listen( PORT, () => console.log(`Server running at port ${PORT}`))