import express from 'express';

// criando a aplicação servidora
const app = express();

// configurações
app.use(cors);
app.use(express.json());

// rodando a aplicação servidora para ouvir requisições na porta 5000
const PORT = 5000;
app.listen( PORT, () => console.log(`Server running at port ${PORT}`))