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

try{
	await mongoClient.connect()
	console.log("MongoDB conected")
} catch (err) {
	console.log(err.message)
}

const db = mongoClient.db()

// funções/rotas (Endpoint)

app.get("/participants", async (req, res) => {
	// buscando participants
	try {
		const participants = await db.collection("participants").find().toArray()
		res.send(participants)
	} catch (err){
		res.status(500).send(err.message)
	}
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

	const messageStatus = { 
		from: name,
		to: 'Todos',
		text: 'entra na sala...',
		type: 'status',
		time: 'HH:mm:ss'//usar day js com datenow
	}

	try {
		const existRegister = await db.collection("participants").findOne({name})
		if (existRegister) return res.status(409).send("Participante já cadastrado")

		await db.collection("message").insertOne(messageStatus)
		await db.collection("participants").insertOne(newParticipants)
		res.status(201).send(newParticipants)
	} catch (err){ 
		res.status(500).send(err.message)
	}
});

app.get("/message", async(req, res) => {
	// buscando message
	try {
		const message = await db.collection("message").find().toArray()
		res.send(message)
	} catch (err) {
		res.status(500).send(err.message)
	}
});

const messageSchema = Joi.object({
	to: Joi.string().required(),
	text: Joi.string().required(),
	type: Joi.string().required()
	})

app.post("/message", async (req, res) => {
	// inserindo message

    const { to, text, type } = req.body;
	const {name} = req.params;

	const validation = messageSchema.validate(req.body, { abortEarly: false })

	if (validation.error){
		const errors = validation.error.details.map(det => det.message)
		return res.status(422).send(errors)
	}

    const objMessage = {
        from: name, 
        to: to, 
        text: text, 
        type: type, 
    }
    
	try {
		await db.collection("message").insertOne(objMessage)
		res.status(201).send(objMessage)
	} catch (err){
		res.status(500).send(err.message)
	}
});

app.get("/", (request, response) => {
    response.send("Executando..");
})

// rodando a aplicação servidora para ouvir requisições na porta 5000
const PORT = 5000;
app.listen( PORT, () => console.log(`Server running at port ${PORT}`))