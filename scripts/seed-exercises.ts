import axios from "axios";

const API_URL = process.env.API_URL || "http://localhost:3000/api";

const exercises = [
  {
    title: "Alongamento cervical lateral",
    description:
      "Alongamento dos músculos escalenos e esternocleidomastóideo, indicado para tensão cervical e RPG cervical.",
    category: "STRETCHING",
    tags: ["cervical", "escaleno", "esternocleidomastóideo", "tensão"],
    instructions:
      "Sentado com coluna ereta, incline a cabeça lateralmente em direção ao ombro direito. Com a mão direita, segue o lado esquerdo da cabeça e aplique pressão suave. Mantenha 30 segundos e repita do outro lado. 3 repetições cada lado.",
    videoUrl: "",
  },
  {
    title: "Retração cervical (Chin Tuck)",
    description:
      "Exercício de correção postural para anteriorização da cabeça (forward head), fortalece músculos profundos do pescoço.",
    category: "POSTURE",
    tags: ["cervical", "forward head", "correção postural", "profundos"],
    instructions:
      'Sentado ou em pé, retraia o queixo para trás como se estivesse fazendo um "duplo queixo". Mantenha o olhar horizontal. Segure 10 segundos, 10 repetições. Evite flexionar o pescoço.',
    videoUrl: "",
  },
  {
    title: "Alongamento de peitoral na parede",
    description:
      "Libera tensão do peitoral maior e menor, melhora a retroversão dos ombros e corrige cifose postural.",
    category: "STRETCHING",
    tags: ["peitoral", "ombro", "cifose", "postura"],
    instructions:
      "De pé ao lado de uma parede, apoie o antebraço no batente da porta a 90° de abdução. Gire o corpo para longe da parede até sentir alongamento no peitoral. Mantenha 30 segundos, 3 repetições cada lado.",
    videoUrl: "",
  },
  {
    title: "Cat-Cow (Gato-Vaca)",
    description:
      "Mobilização segmentar da coluna lombar e torácica em quadrúpede, promove consciência corporal e libera rigidez.",
    category: "MOBILITY",
    tags: ["coluna", "lombar", "torácica", "mobilidade", "quadrúpede"],
    instructions:
      "Em quadrúpede, inspire e arqueie a coluna (cow), olhando para cima. Expire e arredonde a coluna (cat), olhando para o umbigo. 10 ciclos lentos, sincronizando respiração.",
    videoUrl: "",
  },
  {
    title: "Prancha frontal (Front Planche)",
    description:
      "Estabilização do core com ênfase em antiversão pélvica e co-contração abdominal, essencial na reeducação postural global.",
    category: "STRENGTHENING",
    tags: ["core", "abdomen", "estabilização", "prancha"],
    instructions:
      "Apoie os antebraços e pontas dos pés no chão, corpo alinhado dos calcanhares à cabeça. Mantenha co-contração do abdômen e glúteos. Segure 20-30 segundos, 3 séries. Evite hiperextensão lombar.",
    videoUrl: "",
  },
  {
    title: "Respiração diafragmática",
    description:
      "Treino de respiração diafragmática para redução de tensão cervical e otimização do padrão respiratório.",
    category: "BREATHING",
    tags: ["respiração", "diafragma", "cervical", "relaxamento"],
    instructions:
      "Deitado de costas, mãos sobre o abdômen. Inspire pelo nariz expandindo o abdômen (mão sobe), expire pela boca lentamente (mão desce). 10 respirações profundas, 3 séries. Tempo expiratório = 2x inspiratório.",
    videoUrl: "",
  },
  {
    title: "Ponte de glúteos (Bridge)",
    description:
      "Fortalecimento de glúteo máximo e estabilizadores do quadril, promove retroversão pélvica e descompreensão lombar.",
    category: "STRENGTHENING",
    tags: ["glúteo", "quadril", "lombar", "retroversão"],
    instructions:
      "Deitado de costas, joelhos flexionados, pés no chão na largura do quadril. Eleve o quadril contraindo glúteos, sem hiperestender lombar. Segure 5 segundos no topo, 3x12 repetições.",
    videoUrl: "",
  },
  {
    title: "Alongamento de iliopsoas em posição",
    description:
      "Alongamento do músculo iliopsoas em decúbito ventral ou posição de cavaleiro, indicado para retroversão pélvica e hipercifose.",
    category: "STRETCHING",
    tags: ["iliopsoas", "quadril", "retroversão", "cavaleiro"],
    instructions:
      "Ajoelhado, avance um pé à frente em 90°. Empurre o quadril para frente mantendo a coluna ereta até sentir alongamento na região anterior do quadril da perna aterrada. 30 segundos, 3 repetições cada lado.",
    videoUrl: "",
  },
  {
    title: "Rotação torácica sentada",
    description:
      "Mobilização rotacional da coluna torácica em posição sentada, melhora rigidez e auxilia na correção de atitudes cifóticas.",
    category: "MOBILITY",
    tags: ["torácica", "rotação", "cifose", "mobilidade"],
    instructions:
      "Sentado com coluna ereta, cruze os braços no peito. Gire o tronco para a direita, expirando, e retorne ao centro inspirando. 10 repetições cada lado, movimento lento e controlado.",
    videoUrl: "",
  },
  {
    title: "Elevação escapular em decúbito ventral",
    description:
      "Fortalecimento do trapézio inferior e serrátil anterior em decúbito ventral, fundamental para correção de escapula alada.",
    category: "STRENGTHENING",
    tags: ["escapula", "trapézio inferior", "serrátil", "postura"],
    instructions:
      "Deitado de bruços, braços estendidos acima da cabeça. Eleve os braços do chão, ativando os músculos entre as escápulas. Segure 5 segundos, 3x10 repetições. Evite compensar com cervicais.",
    videoUrl: "",
  },
  {
    title: "Equilíbrio unipodal com olhos fechados",
    description:
      "Desafio proprioceptivo avançado para tornozelo e core, melhora controle postural e estabilidade dinâmica.",
    category: "BALANCE",
    tags: ["propriocepção", "tornozelo", "equilíbrio", "core"],
    instructions:
      "Em pé sobre uma perna só, braços ao lado do corpo. Após estabilizar, feche os olhos. Mantenha por 30 segundos sem perder o equilíbrio. 3 repetições cada perna. Use apoio se necessário.",
    videoUrl: "",
  },
  {
    title: "Alongamento de isquiotibiais em decúbito",
    description:
      "Alongamento dos músculos isquiotibiais com auxílio de faixa, promove antiversão pélvica e flexibilidade posterior de coxa.",
    category: "STRETCHING",
    tags: ["isquiotibiais", "coxa posterior", "antiversão", "flexibilidade"],
    instructions:
      "Deitado de costas, eleve uma perna e envolva o pé com uma faixa. Puxe suavemente em direção ao teto até sentir alongamento na parte posterior da coxa. 30 segundos, 3 repetições cada perna.",
    videoUrl: "",
  },
  {
    title: "Ativação de transverso do abdômen",
    description:
      "Exercício de estabilização local do core, focado no transverso do abdômen e multifidos lombares, base da RPG.",
    category: "STRENGTHENING",
    tags: ["core", "transverso", "multífidos", "estabilização", "lombar"],
    instructions:
      'Deitado de costas, joelhos flexionados. Respire e ao expirar, "puxe o umbigo para dentro" como se estivesse apertando um cinto. Segure 10 segundos sem mover a coluna, 10 repetições.',
    videoUrl: "",
  },
  {
    title: "Rotação de quadril em decúbito",
    description:
      "Mobilização rotacional do quadril (clam shell e rotação interna/externa), indicado para rigidez de coxofemoral.",
    category: "MOBILITY",
    tags: ["quadril", "rotação", "coxofemoral", "clam shell"],
    instructions:
      "Deitado lateralmente, joelhos flexionados a 45°. Abra o joelho superior (clam shell) controladamente, mantendo os pés juntos. 3x12 cada lado. Depois, cruze a perna de cima para rotação interna, 3x10.",
    videoUrl: "",
  },
  {
    title: "Respiração com expansão costal",
    description:
      "Treino respiratório focado em expansão torácica lateral e posterior, complementa o trabalho postural torácico.",
    category: "BREATHING",
    tags: ["respiração", "torácica", "expansão costal", "consciência corporal"],
    instructions:
      "Sentado com as mãos nas costelas laterais. Inspire profundamente expandindo as costelas contra as mãos. Expire lentamente pela boca com lábios franzidos. 10 ciclos, 3 séries.",
    videoUrl: "",
  },
  {
    title: "Extensão de joelho sentado com bola",
    description:
      "Fortalecimento do quadríceps com contração isométrica no final do arco, indicado para instabilidade patelofemoral.",
    category: "STRENGTHENING",
    tags: ["joelho", "quadríceps", "patelofemoral", "isométrico"],
    instructions:
      "Sentado na borda da mesa, coloque uma bola entre o joelho e a mesa. Estenda o joelho contraindo o quadríceps e empurrando a bola. Segure 10 segundos, 3x10 cada perna.",
    videoUrl: "",
  },
  {
    title: "Equilíbrio em superfície instável",
    description:
      "Desafio proprioceptivo em superfície instável (BOSU ou almofada), melhora controle motor e prevenção de quedas.",
    category: "BALANCE",
    tags: ["propriocepção", "BOSU", "prevenção quedas", "equilíbrio dinâmico"],
    instructions:
      "Em pé sobre BOSU ou almofada instável, pés na largura do quadril. Mantenha equilíbrio por 30 segundos. Progrida para semi-agachamento e rotação de tronco. 3 séries de 30 segundos.",
    videoUrl: "",
  },
  {
    title: "Alongamento de trapézio superior",
    description:
      "Alongamento do trapézio superior e elevador da escápula, indicado para tensão cervical e cefaleia tensional.",
    category: "STRETCHING",
    tags: ["trapézio", "cervical", "cefaleia", "tensão"],
    instructions:
      "Sentado, incline a orelha em direção ao ombro direito. Com a mão direita, segure a cabeça lateralmente e aplique pressão suave. Mantenha 30 segundos. Repita 3x cada lado. Ombro esquerdo permanece baixo.",
    videoUrl: "",
  },
  {
    title: "Deslizamento escapular na parede",
    description:
      "Exercício de consciência e mobilidade escapular contra a parede, melhora o padrão de movimento do ombro.",
    category: "POSTURE",
    tags: ["escapula", "ombro", "consciência corporal", "parede"],
    instructions:
      "De costas para a parede, escápulas e cabeça encostadas. Deslize os braços para cima em Y mantendo contato com a parede. Retorne lentamente. 3x10 repetições. Evite arquear lombar.",
    videoUrl: "",
  },
  {
    title: "Consciência do pé tripé em pé",
    description:
      "Exercício de consciência e distribuição de peso nos três apoios do pé (calcâneo, 1° e 5° metatarsos), base da reeducação postural.",
    category: "POSTURE",
    tags: ["pé", "tripé", "consciência corporal", "base", "postura"],
    instructions:
      "Em pé descalço, distribua o peso igualmente entre calcâneo, cabeça do 1° metatarso e cabeça do 5° metatarso. Perceba os três pontos de contato. Mantenha 30 segundos, 3 repetições. Progrida para olhos fechados.",
    videoUrl: "",
  },
  {
    title: "Mobilidade de tornozelo em step",
    description:
      "Mobilização da flexão dorsal do tornozelo em step ou superfície elevada, essencial para agachamento e marcha.",
    category: "MOBILITY",
    tags: ["tornozelo", "flexão dorsal", "mobilidade", "marcha"],
    instructions:
      "Com a ponta do pé no step, empurre o joelho para frente sobre o dedo do pé, mantendo o calcanhar no chão. Segure 3 segundos no limite, 3x12 cada tornozelo. Evite valgo do joelho.",
    videoUrl: "",
  },
  {
    title: "Respiração 4-7-8 para relaxamento",
    description:
      "Técnica respiratória de relaxamento com tempo controlado, reduz tônus muscular e ansiedade, complementa sessão de RPG.",
    category: "BREATHING",
    tags: ["respiração", "relaxamento", "ansiedade", "4-7-8"],
    instructions:
      "Inspire pelo nariz contando até 4. Segure a respiração contando até 7. Expire pela boca contando até 8. Repita 4 ciclos. Pratique 2x ao dia, especialmente antes de dormir.",
    videoUrl: "",
  },
];

async function seed() {
  console.log(`Seeding ${exercises.length} exercises to ${API_URL}...`);

  for (const exercise of exercises) {
    try {
      await axios.post(`${API_URL}/exercises`, exercise);
      console.log(`  ✓ ${exercise.title}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${exercise.title}: ${msg}`);
    }
  }

  console.log("Done!");
}

seed();
