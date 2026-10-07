/* Perguntas do quiz da camada 6. Cada pergunta tem: short (nome curto para o painel), d (dificuldade: 1 facil, 2 medio, 3 dificil), q (texto), o (5 alternativas, sempre na ordem A-E) e c (indice da certa, 0 = A). */
/* A ordem das PERGUNTAS e sorteada a cada tentativa (veja app.js). A ordem das alternativas nunca muda. */
/* O numero de cada pergunta no painel do professor (Q1, Q2...) e a posicao dela nesta lista. */
var LEVELS={1:'Fácil',2:'Médio',3:'Difícil'};
var QUIZ=[
{short:'Função principal',d:1,q:'Qual é a função principal da Camada de Apresentação?',
 o:['Controlar a conexão entre os dispositivos','Organizar os dados durante a transmissão','Definir o caminho utilizado pelos pacotes','Preparar e interpretar os dados transmitidos','Gerenciar os endereços usados na comunicação'],c:3},
{short:'Posição no OSI',d:1,q:'Qual posição a Camada de Apresentação ocupa no Modelo OSI?',
 o:['Sexta camada do modelo OSI','Quarta camada do modelo OSI','Quinta camada do modelo OSI','Terceira camada do modelo OSI','Sétima camada do modelo OSI'],c:0},
{short:'Entre quais camadas',d:1,q:'Entre quais camadas está localizada a Camada 6?',
 o:['Transporte e Rede','Rede e Transporte','Sessão e Aplicação','Aplicação e Transporte','Sessão e Transporte'],c:2},
{short:'Conjunto de funções',d:2,q:'Qual conjunto apresenta funções da Camada de Apresentação?',
 o:['Roteamento, endereçamento, controle e transmissão','Sessão, conexão, roteamento e encapsulamento','Transmissão, endereçamento, conexão e roteamento','Controle, transporte, sessão e endereçamento','Compressão, tradução, criptografia e formatação'],c:4},
{short:'Formatos diferentes',d:2,q:'O que pode acontecer quando dois sistemas utilizam formatos diferentes de dados?',
 o:['A rede automaticamente aumenta sua velocidade','A Camada 6 pode realizar uma tradução dos dados','A Camada 3 modifica os dados para ambos','O dispositivo receptor troca seu endereço físico','A Camada 1 converte os dados para outro formato'],c:1},
{short:'Reduzir o tamanho',d:2,q:'Qual função pode reduzir o tamanho dos dados antes da transmissão?',
 o:['Formatação dos dados transmitidos','Tradução dos dados utilizados','Criptografia dos dados utilizados','Compressão dos dados transmitidos','Organização dos dados recebidos'],c:3},
{short:'Finalidade da criptografia',d:2,q:'Qual é a finalidade da criptografia relacionada à Camada 6?',
 o:['Proteger as informações durante a comunicação','Diminuir o espaço ocupado pelos dados','Organizar os dados em diferentes formatos','Definir o caminho seguido pelos dados','Aumentar a velocidade da transmissão'],c:0},
{short:'Formato que o receptor não usa',d:3,q:'Um sistema envia dados em um formato que o receptor não utiliza. Qual função da Camada 6 é mais relevante?',
 o:['Compressão das informações enviadas','Criptografia das informações enviadas','Tradução das informações entre formatos','Transmissão das informações pela rede','Roteamento das informações entre dispositivos'],c:2},
{short:'Camada “tradutora”',d:3,q:'Por que a Camada 6 pode ser considerada uma “tradutora” dos dados?',
 o:['Porque escolhe a rota utilizada pelos pacotes','Porque controla a conexão entre os computadores','Porque determina o endereço de cada dispositivo','Porque controla a velocidade dos dados enviados','Porque transforma os dados para formatos compatíveis'],c:4},
{short:'Comprimir e criptografar',d:3,q:'Um arquivo é comprimido antes de ser enviado e criptografado para proteção. Quais funções aparecem nesse processo?',
 o:['Tradução e roteamento dos dados','Compressão e criptografia dos dados','Formatação e controle dos dados','Transporte e transmissão dos dados','Endereçamento e conexão dos dados'],c:1},
{short:'Compressão × criptografia',d:3,q:'Qual alternativa diferencia melhor a compressão da criptografia?',
 o:['Compressão protege dados; criptografia reduz seu tamanho','Compressão traduz dados; criptografia organiza seus formatos','Compressão reduz dados; criptografia protege suas informações','Compressão roteia dados; criptografia controla sua transmissão','Compressão conecta sistemas; criptografia define seus endereços'],c:2},
{short:'Situação típica da camada 6',d:3,q:'Qual situação representa melhor o trabalho da Camada de Apresentação?',
 o:['Um roteador escolhe o caminho de um pacote','Um sistema recebe um endereço para comunicação','Um dispositivo transmite sinais entre computadores','Um sistema converte, comprime e protege seus dados','Um protocolo controla a entrega dos pacotes enviados'],c:3}
];
var N=QUIZ.length;
