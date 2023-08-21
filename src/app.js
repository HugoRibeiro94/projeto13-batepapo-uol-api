import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import Joi from 'joi';
import dayjs from 'dayjs';

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

console.log(dayjs().format('HH:MM:SS'));


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
		time: dayjs(Date.now()).format('HH:mm:ss')
	}

	try {
		const existRegister = await db.collection("participants").findOne({name})
		if (existRegister) return res.status(409).send("Participante já cadastrado")

		
		await db.collection("participants").insertOne(newParticipants)
		
		await db.collection("messages").insertOne(messageStatus)

		return res.status(201).send(messageStatus)
	} catch (err){ 
		res.status(500).send(err.message)
	}
});

app.get("/messages", async(req, res) => {
	// buscando message

	const {limit} = req.query;

	try {
		const message = await db.collection("messages").find().toArray()

		if ( limit ){
			if ( parseInt(limit) <= 0 || isNaN(parseInt(limit)) ){
				return res.sendStatus(422);
			} else{
				const limitMessage = message.slice(-limit)
				return res.send(limitMessage);
			}
		}
		
		res.send(message)
		
	} catch (err) {
		res.status(500).send(err.message)
	}
});

const messageSchema = Joi.object({
	to: Joi.string().required(),
	text: Joi.string().required(),
	type: Joi.string().valid("message", "private_message").required()//fazer condição 
})

app.post("/messages", async (req, res) => {
	// inserindo message

    const { to, text, type } = req.body;
	
	const User = req.headers.user;

	if( !User ) return res.status(422)// validação do usuario
	
	const validation = messageSchema.validate(req.body, { abortEarly: false })

	if (validation.error){
		const errors = validation.error.details.map(det => det.message)
		return res.status(422).send(errors)
	}

    const objMessage = {
		from: User,
        to: to, 
        text: text, 
        type: type,
		time: dayjs(Date.now()).format('HH:mm:ss') 
    }
    
	try {
		await db.collection("messages").insertOne(objMessage)
		res.status(201).send(objMessage)
	} catch (err){
		res.status(500).send(err.message)
	}
});

app.post('/status', async (req, res) => {
    try {
      const User = req.headers.User;
      if (!User) return res.sendStatus(404);

      const checkname = await db.collection('participants').findOne({ _name: new User })
      if (!checkname) return res.sendStatus(404);

      const userEdit = {
        name: User,
        lastStatus: Date.now()
    }
   
      await db.collection("participants")
      .updateOne({ _name: new User }, { $set: userEdit});

   
      return res.sendStatus(200);

    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
});

app.get("/", (request, response) => {
    response.send("Executando..");
})

// rodando a aplicação servidora para ouvir requisições na porta 5000
const PORT = 5000;
app.listen( PORT, () => console.log(`Server running at port ${PORT}`))