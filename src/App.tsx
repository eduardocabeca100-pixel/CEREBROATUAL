import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Folder,
  FileText,
  Users,
  DollarSign,
  Settings,
  Save,
  Zap,
  UploadCloud,
  Send,
  Trash2,
  Pencil,
  Download,
  UserPlus,
  Table as TableIcon,
  Printer,
  Wand2,
  Loader2,
  CheckCircle2,
  BarChart,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";

import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// --- INJEÇÃO DO TAILWIND CSS (Para CodeSandbox/Vercel) ---
if (
  typeof document !== "undefined" &&
  !document.getElementById("tailwind-cdn")
) {
  const script = document.createElement("script");
  script.id = "tailwind-cdn";
  script.src = "https://cdn.tailwindcss.com";
  document.head.appendChild(script);
}

// --- FIREBASE SETUP OFICIAL ---
const meuFirebaseConfig = {
  apiKey: "AIzaSyDbMEwTA0AQZtvegAEwQ-gtiWyTFPaqUIc",
  authDomain: "projetosia-94a7f.firebaseapp.com",
  projectId: "projetosia-94a7f",
  storageBucket: "projetosia-94a7f.firebasestorage.app",
  messagingSenderId: "614985542986",
  appId: "1:614985542986:web:a30d5b129fe923a9a2e5b3",
};

const app = initializeApp(meuFirebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appIdRef = "cerebro-default-app";

// --- GEMINI API KEY ---
const GEMINI_API_KEY = "AIzaSyBkBq1SbYFfLv_ExPwWGTGIpEqyL6AzhrQ";

// --- INTERFACES TYPESCRIPT ---
interface MembroEquipe {
  id: number;
  nome: string;
  funcao: string;
  documento: string;
  telefone: string;
  portfolioTexto: string;
  portfolioArquivo?: string;
}

type NovoMembroState = Omit<MembroEquipe, "id"> & { id?: number };

interface ItemOrcamento {
  id: number;
  etapa: string;
  item: string;
  unidade: string;
  quantidade: number;
  ocorrencia: number;
  valorUnitario: number;
}

interface ProjetoGerado {
  resumo: string;
  justificativa: string;
  objetivos: {
    geral: string;
    especificos: string[];
  };
  etapas: { titulo: string; texto: string }[];
  democratizacao: string;
  acessibilidade: string;
}

interface IBGEMunicipio {
  nome: string;
  microrregiao: {
    mesorregiao: {
      UF: {
        sigla: string;
      };
    };
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("Dados Iniciais");
  const [printMode, setPrintMode] = useState<"full" | "sheet" | null>(null);

  // --- FIREBASE STATES ---
  const [user, setUser] = useState<any>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [authError, setAuthError] = useState<string>("");

  // --- ESTADOS DO PROJETO E FORMULÁRIOS ---
  const [nomeProjeto, setNomeProjeto] = useState<string>("");
  const [cidade, setCidade] = useState<string>("");
  const [tipoProjeto, setTipoProjeto] = useState<string>("");
  const [resumoProjeto, setResumoProjeto] = useState<string>("");
  const [valorAlvo, setValorAlvo] = useState<string>("");
  const [cidades, setCidades] = useState<string[]>([]);
  const [formError, setFormError] = useState<string>("");

  // --- ESTADOS DA EQUIPE ---
  const [equipeBanco, setEquipeBanco] = useState<MembroEquipe[]>([]);
  const [equipeProjeto, setEquipeProjeto] = useState<MembroEquipe[]>([]);
  const [membroEmEdicao, setMembroEmEdicao] = useState<number | null>(null);
  const [novoMembro, setNovoMembro] = useState<NovoMembroState>({
    nome: "",
    funcao: "",
    documento: "",
    telefone: "",
    portfolioTexto: "",
  });

  // --- CONSTANTES DO ORÇAMENTO ---
  const etapasProjeto: string[] = [
    "1 Pré-produção",
    "2 Produção",
    "3 Pós-produção",
    "4 Divulgação",
    "5 Custos Administrativos",
    "6 Captação de Recursos",
    "7 Remuneração do Proponente",
  ];

  const listaItensOficiais: string[] = [
    "Acessórios cênicos: Adereços",
    "Acessórios cênicos: Figurino",
    "Alimentação: Refeição/Lanche",
    "A.R.T de execução",
    "Assessoria de Imprensa",
    "Assessoria Jurídica",
    "Assessoria Contábil",
    "Cenografia / Expografia",
    "Comissão de Captação de Recursos",
    "Direção Artística / Curadoria",
    "Direção de Produção",
    "Diretor(a) Geral",
    "ECAD / Direitos Autorais",
    "Elaboração de Relatório e Prestação de Contas",
    "Elaboração de Projeto",
    "Elenco - Cachê de ensaio",
    "Elenco - Cachê de apresentação",
    "Equipamentos de Luz / Iluminação (Aluguel)",
    "Equipamentos de Som e Áudio (Aluguel)",
    "Gestão de Tráfego e Redes Sociais",
    "Hospedagem",
    "Locação de Espaço / Teatro / Galeria",
    "Material de escritório",
    "Passagens Terrestres/Aéreas",
    "Pré-produção Executiva",
    "Produção Executiva",
    "Profissional da estética: Maquiador(a)",
    "Técnico de luz",
    "Técnico de som",
    "Transporte de material / Frete",
  ];

  const [orcamento, setOrcamento] = useState<ItemOrcamento[]>([]);

  // --- ESTADOS DA IA ---
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [projetoGerado, setProjetoGerado] = useState<ProjetoGerado | null>(
    null
  );
  const [mensagemIA, setMensagemIA] = useState<string>("");
  const [chat, setChat] = useState<string[]>([
    "Olá! Sou o Assistente IA do Cérebro 2.0. Minha especialidade é redigir projetos culturais blindados para aprovação.",
    "Preencha os Dados Iniciais, informe o Valor Desejado, o Tipo de Projeto e monte a Ficha Técnica. Eu cuidarei de calcular o orçamento matematicamente proporcional à lei e de redigir o texto em formato acadêmico/institucional!",
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const tabs: string[] = [
    "Dados Iniciais",
    "Ficha Técnica",
    "Orçamento do Projeto",
    "Análise IA / Chat",
    "Exportar",
  ];

  // --- EFEITOS (FIREBASE AUTH & DB LOAD) ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error: any) {
        console.error("Erro na Autenticação do Firebase:", error);
        setAuthError(error.code || "erro-desconhecido");
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const docRef = doc(
          db,
          "artifacts",
          appIdRef,
          "users",
          user.uid,
          "workspace",
          "current"
        );
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.nomeProjeto) setNomeProjeto(data.nomeProjeto);
          if (data.cidade) setCidade(data.cidade);
          if (data.tipoProjeto) setTipoProjeto(data.tipoProjeto);
          if (data.resumoProjeto) setResumoProjeto(data.resumoProjeto);
          if (data.valorAlvo) setValorAlvo(data.valorAlvo);
          if (data.equipeBanco) setEquipeBanco(data.equipeBanco);
          if (data.equipeProjeto) setEquipeProjeto(data.equipeProjeto);
          if (data.orcamento) setOrcamento(data.orcamento);
          if (data.projetoGerado) setProjetoGerado(data.projetoGerado);
          if (data.chat) setChat(data.chat);

          if (data.lastUpdate) {
            setLastSaved(new Date(data.lastUpdate));
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados do Firebase:", error);
      } finally {
        setIsDataLoaded(true);
      }
    };
    loadData();
  }, [user]);

  const handleSaveWorkspace = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const docRef = doc(
        db,
        "artifacts",
        appIdRef,
        "users",
        user.uid,
        "workspace",
        "current"
      );
      await setDoc(docRef, {
        nomeProjeto,
        cidade,
        tipoProjeto,
        resumoProjeto,
        valorAlvo,
        equipeBanco,
        equipeProjeto,
        orcamento,
        projetoGerado,
        chat,
        lastUpdate: new Date().toISOString(),
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setFormError("Erro ao salvar na nuvem. Verifique sua conexão.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- EFEITOS IBGE ---
  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios")
      .then((res) => res.json())
      .then((data: IBGEMunicipio[]) => {
        const cidadesFormatadas = data.map(
          (c) => `${c.nome} - ${c.microrregiao.mesorregiao.UF.sigla}`
        );
        cidadesFormatadas.sort((a, b) => a.localeCompare(b));
        setCidades(cidadesFormatadas);
      })
      .catch((err) => console.error("Erro ao buscar cidades:", err));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, activeTab]);

  useEffect(() => {
    if (printMode) {
      setTimeout(() => {
        window.print();
        setPrintMode(null);
      }, 300);
    }
  }, [printMode]);

  // --- FUNÇÕES DE MÁSCARAS E FORMULÁRIOS ---
  const maskCpfCnpj = (value: string): string => {
    let v = value.replace(/\D/g, "");
    if (v.length <= 11) {
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      v = v.replace(/^(\d{2})(\d)/, "$1.$2");
      v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
      v = v.replace(/(\d{4})(\d)/, "$1-$2");
    }
    return v.substring(0, 18);
  };

  const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setNovoMembro({ ...novoMembro, documento: maskCpfCnpj(e.target.value) });

  const maskTelefone = (value: string): string => {
    let v = value.replace(/\D/g, "");
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d)(\d{4})$/, "$1-$2");
    return v.substring(0, 15);
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setNovoMembro({ ...novoMembro, telefone: maskTelefone(e.target.value) });

  const handleValorAlvoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v) {
      v = (parseInt(v, 10) / 100).toFixed(2) + "";
      v = v.replace(".", ",");
      v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
      setValorAlvo("R$ " + v);
    } else {
      setValorAlvo("");
    }
  };

  // --- FUNÇÕES DA EQUIPE ---
  const handleCadastrarMembro = () => {
    if (!novoMembro.nome || !novoMembro.funcao) return;

    if (membroEmEdicao) {
      setEquipeBanco((prev) =>
        prev.map((m) =>
          m.id === membroEmEdicao
            ? { ...(novoMembro as MembroEquipe), id: membroEmEdicao }
            : m
        )
      );
      setEquipeProjeto((prev) =>
        prev.map((m) =>
          m.id === membroEmEdicao
            ? { ...(novoMembro as MembroEquipe), id: membroEmEdicao }
            : m
        )
      );
      setMembroEmEdicao(null);
    } else {
      const membroCompleto: MembroEquipe = {
        ...(novoMembro as MembroEquipe),
        id: Date.now(),
        portfolioArquivo: "anexo.pdf",
      };
      setEquipeBanco([...equipeBanco, membroCompleto]);
    }
    setNovoMembro({
      nome: "",
      funcao: "",
      documento: "",
      telefone: "",
      portfolioTexto: "",
    });
  };

  const cancelarEdicao = () => {
    setMembroEmEdicao(null);
    setNovoMembro({
      nome: "",
      funcao: "",
      documento: "",
      telefone: "",
      portfolioTexto: "",
    });
  };

  const iniciarEdicao = (membro: MembroEquipe) => {
    setMembroEmEdicao(membro.id);
    setNovoMembro({ ...membro });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const vincularAoProjeto = (membro: MembroEquipe) => {
    if (!equipeProjeto.find((m) => m.id === membro.id))
      setEquipeProjeto([...equipeProjeto, membro]);
  };

  const vincularPeloSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    if (!id) return;
    const membro = equipeBanco.find((m) => m.id === id);
    if (membro) vincularAoProjeto(membro);
    e.target.value = "";
  };

  const removerDoProjeto = (id: number) =>
    setEquipeProjeto(equipeProjeto.filter((m) => m.id !== id));

  const excluirDoBanco = (id: number) => {
    setEquipeBanco(equipeBanco.filter((m) => m.id !== id));
    setEquipeProjeto(equipeProjeto.filter((m) => m.id !== id));
  };

  // --- FUNÇÕES DO ORÇAMENTO ---
  const updateOrcamento = (
    id: number,
    field: keyof ItemOrcamento,
    value: string | number
  ) => {
    setOrcamento((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const val = ["quantidade", "ocorrencia", "valorUnitario"].includes(
            field
          )
            ? Number(value)
            : value;
          return { ...item, [field]: val };
        }
        return item;
      })
    );
  };

  const adicionarLinhaOrcamento = (etapaAlvo: string) => {
    const novaLinha: ItemOrcamento = {
      id: Date.now(),
      etapa: etapaAlvo,
      item: "",
      unidade: "Verba",
      quantidade: 1,
      ocorrencia: 1,
      valorUnitario: 0,
    };
    setOrcamento([...orcamento, novaLinha]);
  };

  const removerLinhaOrcamento = (id: number) =>
    setOrcamento(orcamento.filter((item) => item.id !== id));

  const round2 = (num: number): number =>
    Math.round((num + Number.EPSILON) * 100) / 100;
  const calcularTotalLinha = (item: ItemOrcamento): number =>
    round2(item.quantidade * item.ocorrencia * item.valorUnitario);
  const calcularTotalGeral = (): number =>
    round2(orcamento.reduce((acc, item) => acc + calcularTotalLinha(item), 0));
  const calcularTotalEtapa = (etapa: string): number =>
    round2(
      orcamento
        .filter((i) => i.etapa === etapa)
        .reduce((acc, item) => acc + calcularTotalLinha(item), 0)
    );
  const formatMoney = (value: number): string =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  // --- IA: GERAÇÃO INTELIGENTE COM GEMINI ---
  const gerarProjetoInteligente = async () => {
    setFormError("");
    if (!nomeProjeto || !resumoProjeto || !valorAlvo || !tipoProjeto) {
      setFormError(
        "⚠️ Atenção: Preencha o Nome do Projeto, Cidade, Tipo do Projeto, Valor Desejado e o Resumo da ideia para a IA funcionar."
      );
      return;
    }

    let alvoNum = parseFloat(
      valorAlvo.replace(/[R$\s\.]/g, "").replace(",", ".")
    );
    if (isNaN(alvoNum) || alvoNum <= 0) {
      setFormError("⚠️ Valor financeiro inválido.");
      return;
    }

    setIsGenerating(true);

    try {
      const cidadeFormatada = cidade ? cidade : "território catarinense";

      const promptTexto = `Você é um parecerista especialista em projetos culturais (Leis de Incentivo, Rouanet, PIC).
      Escreva os textos institucionais de um projeto cultural com as seguintes informações:
      - Nome do Projeto: ${nomeProjeto}
      - Cidade Base: ${cidadeFormatada}
      - Segmento Cultural: ${tipoProjeto}
      - Resumo da ideia original: ${resumoProjeto}
      - Valor solicitado: ${formatMoney(alvoNum)}

      Escreva textos formais, convincentes, focados no impacto social, descentralização e economia criativa.
      RETORNE EXATAMENTE O SEGUINTE JSON VÁLIDO (sem marcações markdown antes ou depois):
      {
        "resumo": "Texto do resumo abordando as premissas artísticas (aprox. 100 palavras)",
        "justificativa": "Texto da justificativa focando na demanda e economia (aprox. 250 palavras)",
        "objetivos": {
          "geral": "Objetivo geral da obra",
          "especificos": ["Objetivo específico 1", "Objetivo específico 2", "Objetivo específico 3", "Objetivo específico 4", "Objetivo específico 5"]
        },
        "etapas": [
          { "titulo": "1. Pré-produção / Preparação", "texto": "Descrição robusta das atividades" },
          { "titulo": "2. Produção / Execução", "texto": "Descrição robusta das atividades" },
          { "titulo": "3. Pós-produção", "texto": "Descrição de fechamento e prestação de contas" }
        ],
        "democratizacao": "Estratégias de democratização do acesso e contrapartida social (aprox. 150 palavras)",
        "acessibilidade": "Medidas claras de acessibilidade arquitetônica, comunicacional e atitudinal (aprox. 150 palavras)"
      }`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptTexto }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );

      if (!response.ok) throw new Error("Falha na API da IA");

      const data = await response.json();
      const textoGerado = JSON.parse(
        data.candidates[0].content.parts[0].text
      ) as ProjetoGerado;

      setProjetoGerado(textoGerado);

      // GERAÇÃO MATEMÁTICA DO ORÇAMENTO (PIC SC)
      let novoOrcamento: ItemOrcamento[] = [];
      let baseId = Date.now();

      const tPre = round2(alvoNum * 0.1);
      const tProd = round2(alvoNum * 0.45);
      const tPos = round2(alvoNum * 0.05);
      const tDiv = round2(alvoNum * 0.15);
      const tAdm = round2(alvoNum * 0.1);
      const tCap = round2(alvoNum * 0.05);
      const tProp = round2(alvoNum * 0.1);

      // -- Etapa 1 --
      const pre1 = round2(tPre * 0.6);
      const pre2 = round2(tPre - pre1);
      novoOrcamento.push({
        id: baseId++,
        etapa: "1 Pré-produção",
        item: "Elaboração e Formatação de Projeto",
        unidade: "Verba",
        quantidade: 1,
        ocorrencia: 1,
        valorUnitario: pre1,
      });
      novoOrcamento.push({
        id: baseId++,
        etapa: "1 Pré-produção",
        item: "Pré-produção Executiva / Alinhamentos",
        unidade: "Verba",
        quantidade: 1,
        ocorrencia: 1,
        valorUnitario: pre2,
      });

      // -- Etapa 2 --
      let prodGasto = 0;
      if (equipeProjeto.length > 0) {
        const verbaEquipe = round2(tProd * 0.5);
        const cacheIndividual = round2(verbaEquipe / equipeProjeto.length);

        equipeProjeto.forEach((membro, index) => {
          let valorFinal = cacheIndividual;
          if (index === equipeProjeto.length - 1) {
            valorFinal = round2(
              verbaEquipe - cacheIndividual * (equipeProjeto.length - 1)
            );
          }
          novoOrcamento.push({
            id: baseId++,
            etapa: "2 Produção",
            item: `Cachê: ${membro.funcao} (${membro.nome.split(" ")[0]})`,
            unidade: "Projeto",
            quantidade: 1,
            ocorrencia: 1,
            valorUnitario: valorFinal,
          });
          prodGasto = round2(prodGasto + valorFinal);
        });

        const prodEstrutura1 = round2(tProd * 0.3);
        const prodEstrutura2 = round2(tProd - prodGasto - prodEstrutura1);

        let itemEstrutura1 = "Cenografia e Figurino (Confecção)";
        let itemEstrutura2 = "Locação de Equipamentos Técnicos (Luz/Som)";

        if (
          tipoProjeto === "Literatura" ||
          tipoProjeto === "Exposição / Artes Visuais"
        ) {
          itemEstrutura1 = "Projeto Gráfico, Impressão ou Expografia";
          itemEstrutura2 = "Materiais de Montagem e Estrutura Artística";
        }

        novoOrcamento.push({
          id: baseId++,
          etapa: "2 Produção",
          item: itemEstrutura1,
          unidade: "Verba",
          quantidade: 1,
          ocorrencia: 1,
          valorUnitario: prodEstrutura1,
        });
        novoOrcamento.push({
          id: baseId++,
          etapa: "2 Produção",
          item: itemEstrutura2,
          unidade: "Verba",
          quantidade: 1,
          ocorrencia: 1,
          valorUnitario: prodEstrutura2,
        });
      } else {
        const prod1 = round2(tProd * 0.25);
        const prod2 = round2(tProd * 0.25);
        const prod3 = round2(tProd * 0.3);
        const prod4 = round2(tProd - prod1 - prod2 - prod3);
        novoOrcamento.push({
          id: baseId++,
          etapa: "2 Produção",
          item: "Direção Artística / Coordenação / Curadoria",
          unidade: "Projeto",
          quantidade: 1,
          ocorrencia: 1,
          valorUnitario: prod1,
        });
        novoOrcamento.push({
          id: baseId++,
          etapa: "2 Produção",
          item: "Cachês Artísticos / Equipe Base",
          unidade: "Verba",
          quantidade: 1,
          ocorrencia: 1,
          valorUnitario: prod2,
        });
        novoOrcamento.push({
          id: baseId++,
          etapa: "2 Produção",
          item: "Estruturação Artística e Materiais",
          unidade: "Verba",
          quantidade: 1,
          ocorrencia: 1,
          valorUnitario: prod3,
        });
        novoOrcamento.push({
          id: baseId++,
          etapa: "2 Produção",
          item: "Locação de Equipamentos Técnicos",
          unidade: "Verba",
          quantidade: 1,
          ocorrencia: 1,
          valorUnitario: prod4,
        });
      }

      // -- Etapas Restantes --
      const pos1 = round2(tPos * 0.5);
      const pos2 = round2(tPos - pos1);
      novoOrcamento.push({
        id: baseId++,
        etapa: "3 Pós-produção",
        item: "Edição de Audiovisual e Registros",
        unidade: "Verba",
        quantidade: 1,
        ocorrencia: 1,
        valorUnitario: pos1,
      });
      novoOrcamento.push({
        id: baseId++,
        etapa: "3 Pós-produção",
        item: "Elaboração de Relatório e Prestação de Contas",
        unidade: "Verba",
        quantidade: 1,
        ocorrencia: 1,
        valorUnitario: pos2,
      });

      const div1 = round2(tDiv * 0.4);
      const div2 = round2(tDiv * 0.3);
      const div3 = round2(tDiv - div1 - div2);
      novoOrcamento.push({
        id: baseId++,
        etapa: "4 Divulgação",
        item: "Assessoria de Imprensa",
        unidade: "Svc",
        quantidade: 1,
        ocorrencia: 1,
        valorUnitario: div1,
      });
      novoOrcamento.push({
        id: baseId++,
        etapa: "4 Divulgação",
        item: "Gestão de Tráfego e Redes Sociais",
        unidade: "Verba",
        quantidade: 1,
        ocorrencia: 1,
        valorUnitario: div2,
      });
      novoOrcamento.push({
        id: baseId++,
        etapa: "4 Divulgação",
        item: "Design Gráfico e Identidade Visual",
        unidade: "Verba",
        quantidade: 1,
        ocorrencia: 1,
        valorUnitario: div3,
      });

      const adm1 = round2(tAdm * 0.6);
      const adm2 = round2(tAdm - adm1);
      novoOrcamento.push({
        id: baseId++,
        etapa: "5 Custos Administrativos",
        item: "Assessoria Contábil",
        unidade: "Verba",
        quantidade: 1,
        ocorrencia: 1,
        valorUnitario: adm1,
      });
      novoOrcamento.push({
        id: baseId++,
        etapa: "5 Custos Administrativos",
        item: "Assessoria Jurídica",
        unidade: "Verba",
        quantidade: 1,
        ocorrencia: 1,
        valorUnitario: adm2,
      });

      novoOrcamento.push({
        id: baseId++,
        etapa: "6 Captação de Recursos",
        item: "Comissão de Captação de Recursos",
        unidade: "Verba",
        quantidade: 1,
        ocorrencia: 1,
        valorUnitario: tCap,
      });
      novoOrcamento.push({
        id: baseId++,
        etapa: "7 Remuneração do Proponente",
        item: "Produção Executiva da Proponente",
        unidade: "Verba",
        quantidade: 1,
        ocorrencia: 1,
        valorUnitario: tProp,
      });

      setOrcamento(novoOrcamento);
    } catch (error) {
      console.error("Erro na IA:", error);
      setFormError(
        "Erro ao conectar com a IA do Gemini. Verifique a sua ligação à internet."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const realizarAnaliseIA = async () => {
    if (!projetoGerado || orcamento.length === 0) {
      setChat((prev) => [
        ...prev,
        "⚠️ **Erro:** O projeto ainda está em branco. Preencha os Dados Iniciais e clique em 'Gerar Projeto' primeiro.",
      ]);
      return;
    }

    setIsAnalyzing(true);
    try {
      const total = calcularTotalGeral();
      const divPerc = (calcularTotalEtapa("4 Divulgação") / total) * 100;
      const admPerc =
        (calcularTotalEtapa("5 Custos Administrativos") / total) * 100;
      const propPerc =
        (calcularTotalEtapa("7 Remuneração do Proponente") / total) * 100;
      const capPerc =
        (calcularTotalEtapa("6 Captação de Recursos") / total) * 100;

      const promptAnalise = `Atue como um Parecerista rigoroso de Leis de Incentivo à Cultura.
      Analise a estrutura orçamental do projeto "${nomeProjeto}" (${tipoProjeto}).
      
      Dados Fiscais do Orçamento:
      - Valor Total Projetado: ${formatMoney(total)}
      - Divulgação: ${divPerc.toFixed(2)}% (Limite máximo permitido: 20%)
      - Custos Administrativos: ${admPerc.toFixed(
        2
      )}% (Limite máximo permitido: 30%)
      - Remuneração do Proponente: ${propPerc.toFixed(
        2
      )}% (Limite máximo permitido: 15%)
      - Captação de Recursos: ${capPerc.toFixed(
        2
      )}% (Limite máximo permitido: 10%)

      Forneça um parecer claro e direto, estruturado em Markdown (usando negritos e listas), contendo rigorosamente:
      1. **Score do Parecerista** (uma nota de 0 a 100) baseada puramente no respeito às métricas acima.
      2. **Análise de Coerência** (apenas 2 parágrafos) sobre a viabilidade e impacto da estrutura para o segmento de ${tipoProjeto}.
      3. **Avisos Financeiros** (destaque forte se algum limite de percentagem for ultrapassado).
      4. **Veredicto Oficial** (Aprovado, Aprovado com Ressalvas ou Reprovado).`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptAnalise }] }],
          }),
        }
      );

      if (!response.ok) throw new Error("Falha na API da IA");

      const data = await response.json();
      const analiseTexto = data.candidates[0].content.parts[0].text;

      setChat((prev) => [...prev, analiseTexto]);
    } catch (error) {
      console.error(error);
      setChat((prev) => [
        ...prev,
        "⚠️ Ocorreu um erro ao comunicar com a inteligência do Gemini. Tente novamente.",
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendIA = async () => {
    if (!mensagemIA.trim()) return;

    const novaMensagem = `Você: ${mensagemIA}`;
    const promptUsuario = mensagemIA;

    setChat((prev) => [...prev, novaMensagem, "IA a pensar..."]);
    setMensagemIA("");

    try {
      const contexto = chat.slice(-4).join("\n");
      const promptCompleto = `Atue como um Consultor Sênior Especialista em Projetos Culturais, respondendo a dúvidas estratégicas de um produtor cultural.
      Contexto das últimas mensagens desta conversa:
      ${contexto}
      
      Pergunta atual do produtor: "${promptUsuario}"
      
      Responda de forma altamente profissional, didática e motivadora. Use formatação Markdown (negritos, tópicos) para tornar a resposta visualmente apelativa e fácil de compreender. Vá direto ao ponto.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptCompleto }] }],
          }),
        }
      );

      if (!response.ok) throw new Error("Falha na API");

      const data = await response.json();
      const respostaIA = data.candidates[0].content.parts[0].text;

      setChat((prev) => {
        const temp = [...prev];
        temp.pop();
        return [...temp, respostaIA];
      });
    } catch (error) {
      console.error(error);
      setChat((prev) => {
        const temp = [...prev];
        temp.pop();
        return [
          ...temp,
          "⚠️ Falha na ligação ao servidor Gemini. Verifique se tem acesso à internet ou tente mais tarde.",
        ];
      });
    }
  };

  // --- RENDERIZADORES DE ABAS ---
  const renderDadosIniciais = () => (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="col-span-1 xl:col-span-8 space-y-6">
          <div className="bg-[#0F172A] border border-white/10 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Folder className="text-cyan-400" size={24} /> Dados Básicos do
                Projeto
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="text-xs text-gray-400 mb-1 block text-left">
                  Nome do Projeto (Obrigatório)
                </label>
                <input
                  value={nomeProjeto}
                  onChange={(e) => setNomeProjeto(e.target.value)}
                  placeholder="Ex: O Canto das Baleias"
                  className="bg-[#111827] border border-white/10 rounded-2xl px-4 py-4 outline-none focus:border-cyan-400 transition-colors w-full text-white"
                />
              </div>
              <div className="relative">
                <label className="text-xs text-gray-400 mb-1 block text-left">
                  Cidade Base (Obrigatório)
                </label>
                <input
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  list="cidades"
                  placeholder="Ex: Jaraguá do Sul - SC"
                  className="bg-[#111827] border border-white/10 rounded-2xl px-4 py-4 outline-none focus:border-cyan-400 transition-colors w-full text-white"
                />
                <datalist id="cidades">
                  {cidades.map((cid, index) => (
                    <option key={index} value={cid} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="text-xs text-green-400 mb-1 block text-left font-bold uppercase tracking-wider">
                  Valor Total Solicitado (Obrigatório)
                </label>
                <input
                  value={valorAlvo}
                  onChange={handleValorAlvoChange}
                  placeholder="Ex: R$ 50.000,00"
                  className="bg-green-500/5 border border-green-500/30 rounded-2xl px-4 py-4 outline-none focus:border-green-400 transition-colors w-full text-white font-black text-lg"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block text-left uppercase tracking-wider">
                  Tipo do Projeto (Obrigatório)
                </label>
                <select
                  value={tipoProjeto}
                  onChange={(e) => setTipoProjeto(e.target.value)}
                  className="bg-[#111827] border border-white/10 rounded-2xl px-4 py-4 outline-none focus:border-cyan-400 transition-colors w-full text-white appearance-none cursor-pointer"
                >
                  <option value="">Selecione o Segmento Cultural...</option>
                  <option value="Teatro">Teatro</option>
                  <option value="Teatro Musical">Teatro Musical</option>
                  <option value="Música">Música / Banda</option>
                  <option value="Dança">Dança</option>
                  <option value="Exposição / Artes Visuais">
                    Exposição / Artes Visuais
                  </option>
                  <option value="Festival / Mostra">
                    Festival / Mostra Cultural
                  </option>
                  <option value="Audiovisual">Audiovisual / Cinema</option>
                  <option value="Literatura">Literatura / Publicação</option>
                  <option value="Outros">Outro Segmento</option>
                </select>
              </div>
            </div>

            <label className="text-xs text-gray-400 mb-1 block text-left">
              O que é o projeto? Resumo da ideia (Obrigatório)
            </label>
            <textarea
              value={resumoProjeto}
              onChange={(e) => setResumoProjeto(e.target.value)}
              placeholder="Ex: Espetáculo de teatro focado na dramaturgia catarinense com 3 atores... / Festival de música instrumental de 2 dias..."
              className="w-full h-32 bg-[#111827] border border-white/10 rounded-2xl p-4 outline-none focus:border-cyan-400 transition-colors resize-none text-white leading-relaxed"
            />

            {formError && (
              <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertTriangle size={18} /> {formError}
              </div>
            )}

            <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6">
              <p className="text-sm text-gray-400 max-w-sm">
                <AlertTriangle
                  size={16}
                  className="inline text-yellow-500 mb-1"
                />{" "}
                A IA redigirá baseando-se no <b>Tipo</b> do projeto e dividirá o
                orçamento em exatos <b>{valorAlvo || "R$ 0,00"}</b>.
              </p>
              <button
                onClick={gerarProjetoInteligente}
                disabled={isGenerating}
                className={`w-full md:w-auto px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-lg transition-all shadow-lg ${
                  isGenerating
                    ? "bg-purple-900 text-purple-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-500 to-purple-600 hover:scale-[1.02] hover:shadow-cyan-500/30 text-white"
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={24} className="animate-spin" /> Gerando
                    Textos e Orçamento...
                  </>
                ) : (
                  <>
                    <Wand2 size={24} /> Gerar Projeto Inteligente
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-1 xl:col-span-4 flex flex-col">
          <div className="bg-[#0F172A] border border-white/10 rounded-3xl p-5 shadow-xl flex flex-col h-full min-h-[400px]">
            <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Users className="text-purple-400" size={20} /> Equipe do
                Projeto
              </h3>
              <span className="text-xs bg-white/10 px-2 py-1 rounded-lg">
                {equipeProjeto.length} vinculados
              </span>
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">
                Vincular equipe já cadastrada:
              </label>
              <select
                onChange={vincularPeloSelect}
                className="w-full bg-[#111827] border border-purple-500/30 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="">+ Selecionar profissional...</option>
                {equipeBanco
                  .filter((m) => !equipeProjeto.find((p) => p.id === m.id))
                  .map((m) => (
                    <option key={m.id} value={m.id.toString()}>
                      {m.nome} - {m.funcao}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 no-scrollbar">
              {equipeProjeto.length === 0 ? (
                <div className="text-center text-gray-500 mt-6 border-2 border-dashed border-white/5 rounded-xl p-4">
                  <Users size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs">
                    A Ficha Técnica impacta na divisão do orçamento.
                    <br />
                    Use a aba Ficha Técnica para cadastrar.
                  </p>
                </div>
              ) : (
                equipeProjeto.map((membro) => (
                  <div
                    key={membro.id}
                    className="bg-[#111827] border border-white/5 rounded-xl p-3 flex justify-between items-center group"
                  >
                    <div>
                      <h5 className="font-semibold text-sm text-white">
                        {membro.nome}
                      </h5>
                      <p className="text-xs text-cyan-400">{membro.funcao}</p>
                    </div>
                    <button
                      onClick={() => removerDoProjeto(membro.id)}
                      className="text-red-400/50 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {projetoGerado && (
        <div className="bg-[#F8FAFC] text-slate-900 rounded-3xl p-8 md:p-12 shadow-2xl mt-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10 shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2
                className="text-green-600 flex-shrink-0"
                size={24}
              />
              <div>
                <p className="font-bold text-sm">
                  Estrutura de Texto e Orçamento gerados com sucesso!
                </p>
                <p className="text-xs mt-0.5">
                  O texto abaixo segue a lógica rigorosa dos pareceristas para{" "}
                  <b>{tipoProjeto}</b>. A planilha foi calculada para atingir
                  exatos <b>{valorAlvo}</b> e está disponível na aba "Orçamento
                  do Projeto".
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("Análise IA / Chat")}
              className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors flex-shrink-0"
            >
              <BarChart size={16} /> Ver Análise e Avaliar Limites
            </button>
          </div>

          <div className="flex items-center justify-between mb-10 border-b border-slate-200 pb-6">
            <div>
              <h2 className="text-3xl font-black uppercase text-slate-800">
                {nomeProjeto || "Projeto Sem Título"}
              </h2>
              <p className="text-sm font-bold text-cyan-700 uppercase tracking-widest mt-2 flex items-center gap-2">
                Projeto Cultural Estruturado • {tipoProjeto}
              </p>
            </div>
          </div>

          <div className="space-y-10 font-serif leading-relaxed text-lg text-slate-700">
            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3 font-sans border-l-4 border-cyan-500 pl-3">
                1. Resumo da Obra
              </h3>
              <p className="text-justify">{projetoGerado.resumo}</p>
            </section>
            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3 font-sans border-l-4 border-cyan-500 pl-3">
                2. Justificativa
              </h3>
              <p className="text-justify whitespace-pre-wrap">
                {projetoGerado.justificativa}
              </p>
            </section>
            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3 font-sans border-l-4 border-cyan-500 pl-3">
                3. Objetivos
              </h3>
              <p className="text-justify mb-3">
                <strong>Objetivo Geral:</strong> {projetoGerado.objetivos.geral}
              </p>
              <p className="font-bold mb-2 font-sans text-slate-900">
                Objetivos Específicos:
              </p>
              <ul className="list-disc pl-8 space-y-2">
                {projetoGerado.objetivos.especificos.map((obj, i) => (
                  <li key={i} className="text-justify">
                    {obj}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-4 font-sans border-l-4 border-cyan-500 pl-3">
                4. Etapas de Trabalho
              </h3>
              <div className="space-y-4">
                {projetoGerado.etapas.map((etapa, i) => (
                  <div key={i}>
                    <p className="font-bold text-slate-900 font-sans">
                      {etapa.titulo}
                    </p>
                    <p className="text-justify">{etapa.texto}</p>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3 font-sans border-l-4 border-cyan-500 pl-3">
                5. Democratização e Contrapartida
              </h3>
              <p className="text-justify whitespace-pre-wrap">
                {projetoGerado.democratizacao}
              </p>
            </section>
            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3 font-sans border-l-4 border-cyan-500 pl-3">
                6. Medidas de Acessibilidade
              </h3>
              <p className="text-justify whitespace-pre-wrap">
                {projetoGerado.acessibilidade}
              </p>
            </section>
          </div>
        </div>
      )}
    </div>
  );

  const renderFichaTecnica = () => (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div
        className={`bg-[#0F172A] border ${
          membroEmEdicao
            ? "border-cyan-400 shadow-cyan-500/20"
            : "border-white/10"
        } rounded-3xl p-6 shadow-xl transition-all`}
      >
        <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-white">
          <UserPlus
            className={membroEmEdicao ? "text-cyan-400" : "text-purple-400"}
            size={24}
          />
          {membroEmEdicao ? "Editar Profissional" : "Cadastrar Profissional"}
        </h3>

        <div className="flex flex-col xl:flex-row gap-3 items-center w-full mb-4">
          <input
            value={novoMembro.nome}
            onChange={(e) =>
              setNovoMembro({ ...novoMembro, nome: e.target.value })
            }
            placeholder="Nome completo"
            className="w-full xl:w-56 bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-purple-400 text-sm text-white"
          />
          <select
            value={novoMembro.funcao}
            onChange={(e) =>
              setNovoMembro({ ...novoMembro, funcao: e.target.value })
            }
            className="w-full xl:w-48 bg-[#111827] border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-purple-400 text-sm text-gray-300"
          >
            <option value="">Função / Cargo</option>
            <option>Diretor(a) Geral</option>
            <option>Diretor(a) Artístico</option>
            <option>Diretor(a) Musical</option>
            <option>Produtor(a) Executivo</option>
            <option>Ator / Atriz</option>
            <option>Músico(a)</option>
            <option>Figurinista</option>
            <option>Iluminador(a)</option>
            <option>Cenógrafo(a)</option>
            <option>Assessor(a) de Imprensa</option>
          </select>
          <input
            value={novoMembro.documento}
            onChange={handleDocumentoChange}
            placeholder="CPF/CNPJ"
            className="w-full xl:w-40 bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-purple-400 text-sm text-white"
          />
          <input
            value={novoMembro.telefone}
            onChange={handleTelefoneChange}
            placeholder="Telefone"
            className="w-full xl:w-40 bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-purple-400 text-sm text-white"
          />
          <input
            value={novoMembro.portfolioTexto}
            onChange={(e) =>
              setNovoMembro({ ...novoMembro, portfolioTexto: e.target.value })
            }
            placeholder="Link ou Resumo Biográfico"
            className="w-full xl:flex-1 bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-purple-400 text-sm text-white"
          />

          <button
            title="Anexar PDF"
            className="w-full xl:w-auto flex items-center justify-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 px-4 py-2.5 rounded-xl transition-colors text-sm font-medium"
          >
            <UploadCloud size={18} /> Anexo
          </button>

          {membroEmEdicao && (
            <button
              onClick={cancelarEdicao}
              className="w-full xl:w-auto bg-gray-600 hover:bg-gray-500 px-6 py-2.5 rounded-xl font-bold text-sm transition-colors text-white whitespace-nowrap"
            >
              Cancelar
            </button>
          )}

          <button
            onClick={handleCadastrarMembro}
            disabled={!novoMembro.nome || !novoMembro.funcao}
            className={`w-full xl:w-auto px-6 py-2.5 rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform disabled:opacity-50 text-white whitespace-nowrap ${
              membroEmEdicao
                ? "bg-cyan-500"
                : "bg-gradient-to-r from-cyan-500 to-purple-600"
            }`}
          >
            {membroEmEdicao ? "Atualizar" : "Salvar"}
          </button>
        </div>
      </div>

      <div className="bg-[#0F172A] border border-white/10 rounded-3xl p-6 shadow-xl">
        <h4 className="font-bold text-lg mb-6 text-gray-200">
          Banco de Talentos
        </h4>

        {equipeBanco.length === 0 ? (
          <div className="text-center py-10 text-gray-500 border-2 border-dashed border-white/5 rounded-2xl">
            <Users size={40} className="mx-auto mb-3 opacity-20" />
            <p>Nenhum profissional cadastrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {equipeBanco.map((membro) => {
              const isVinculado = equipeProjeto.some((m) => m.id === membro.id);
              return (
                <div
                  key={membro.id}
                  className="bg-[#111827] border border-white/5 rounded-2xl p-5 flex flex-col justify-between gap-4 relative group hover:border-white/20 transition-colors"
                >
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => iniciarEdicao(membro)}
                      className="text-gray-400 hover:text-cyan-400 transition-colors p-1 bg-white/5 rounded-lg"
                      title="Editar Dados"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => excluirDoBanco(membro.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors p-1 bg-white/5 rounded-lg"
                      title="Excluir Permanentemente"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="pr-16">
                    <h5 className="font-bold text-white text-lg">
                      {membro.nome}
                    </h5>
                    <div className="flex flex-wrap gap-2 mt-2 mb-3">
                      <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-md font-medium">
                        {membro.funcao}
                      </span>
                      <span className="text-xs text-gray-400 border border-white/10 px-2.5 py-1 rounded-md">
                        {membro.documento}
                      </span>
                    </div>
                    {membro.portfolioTexto && (
                      <p className="text-xs text-gray-400 line-clamp-2 italic mb-2">
                        "{membro.portfolioTexto}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {isVinculado ? (
                      <button
                        onClick={() => removerDoProjeto(membro.id)}
                        className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-bold transition-colors w-full text-center"
                      >
                        Remover do Projeto Atual
                      </button>
                    ) : (
                      <button
                        onClick={() => vincularAoProjeto(membro)}
                        className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-colors w-full text-center"
                      >
                        Vincular ao Projeto
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderOrcamento = () => {
    return (
      <div className="max-w-[1400px] mx-auto flex flex-col space-y-6">
        <div className="bg-[#0F172A] border border-white/10 rounded-3xl overflow-hidden shadow-xl p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-4 mb-1">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <TableIcon className="text-green-400" size={24} /> Orçamento
                  Geral do Projeto (PIC)
                </h3>
              </div>
              <p className="text-gray-400 text-sm">
                Visualize e gerencie todos os itens do orçamento categorizados
                pelas etapas oficiais.
              </p>
            </div>

            <div
              className={`px-6 py-3 rounded-xl border flex flex-col md:items-end ${
                calcularTotalGeral() !==
                  parseFloat(
                    (valorAlvo || "0")
                      .replace(/[R$\s\.]/g, "")
                      .replace(",", ".")
                  ) && orcamento.length > 0
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 text-green-400"
              }`}
            >
              <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                Total Apurado
              </span>
              <span className="font-black text-xl">
                {formatMoney(calcularTotalGeral())}
              </span>
              {valorAlvo && (
                <span className="text-xs mt-1">Alvo: {valorAlvo}</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-white/10 rounded-3xl p-6 shadow-xl overflow-x-auto">
          {orcamento.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              <AlertTriangle size={40} className="mx-auto mb-3 opacity-20" />
              <p>
                Sua planilha está vazia. Volte na aba Dados Iniciais e clique em{" "}
                <b>"Gerar Projeto Inteligente"</b> <br />
                para a IA montar a matemática do seu orçamento automaticamente.
              </p>
            </div>
          )}
          {orcamento.length > 0 && (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-white/10 bg-white/5">
                  <th className="py-3 px-4 font-medium rounded-tl-lg w-[40%]">
                    Nome do Item
                  </th>
                  <th className="py-3 px-2 font-medium w-28">Unidade</th>
                  <th className="py-3 px-2 font-medium w-24">Qtd</th>
                  <th className="py-3 px-2 font-medium w-24">Ocorr.</th>
                  <th className="py-3 px-2 font-medium w-36">
                    Vlr Unitário (R$)
                  </th>
                  <th className="py-3 px-4 font-medium w-40 text-right">
                    Total (R$)
                  </th>
                  <th className="py-3 px-2 w-14 text-center rounded-tr-lg">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <datalist id="lista-itens-oficiais">
                  {listaItensOficiais.map((opcao) => (
                    <option key={opcao} value={opcao} />
                  ))}
                </datalist>
                <datalist id="unidades">
                  <option value="Verba" />
                  <option value="Dia" />
                  <option value="Mês" />
                  <option value="Projeto" />
                  <option value="Serviço" />
                  <option value="Cachê" />
                  <option value="Hora" />
                  <option value="Unidade" />
                </datalist>

                {etapasProjeto.map((etapa) => {
                  const itensEtapa = orcamento.filter(
                    (item) => item.etapa === etapa
                  );
                  const totalEtapa = itensEtapa.reduce(
                    (acc, item) => acc + calcularTotalLinha(item),
                    0
                  );

                  return (
                    <React.Fragment key={etapa}>
                      <tr className="bg-[#111827] border-y border-white/10 shadow-sm">
                        <td
                          colSpan={5}
                          className="py-4 px-4 font-black text-cyan-400 uppercase tracking-wider text-xs"
                        >
                          {etapa}
                        </td>
                        <td className="py-4 px-4 text-right font-black text-cyan-400 text-sm">
                          {formatMoney(totalEtapa)}
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => adicionarLinhaOrcamento(etapa)}
                            className="text-cyan-400 hover:text-white bg-cyan-900/30 hover:bg-cyan-600/50 p-1.5 rounded-lg transition-colors"
                            title={`Adicionar novo item em ${etapa}`}
                          >
                            <Plus size={18} />
                          </button>
                        </td>
                      </tr>

                      {itensEtapa.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-6 text-center text-gray-600 italic border-b border-white/5"
                          >
                            Nenhum item. Clique no{" "}
                            <Plus size={12} className="inline" /> na linha acima
                            para adicionar.
                          </td>
                        </tr>
                      ) : (
                        itensEtapa.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-white/5 hover:bg-white/10 transition-colors group"
                          >
                            <td className="py-2 px-3">
                              <input
                                list="lista-itens-oficiais"
                                value={item.item}
                                onChange={(e) =>
                                  updateOrcamento(
                                    item.id,
                                    "item",
                                    e.target.value
                                  )
                                }
                                placeholder="Selecione na lista ou digite..."
                                className="bg-transparent border border-transparent hover:border-white/20 focus:border-cyan-400 rounded-lg px-3 py-2.5 w-full outline-none text-white font-medium"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                list="unidades"
                                value={item.unidade}
                                onChange={(e) =>
                                  updateOrcamento(
                                    item.id,
                                    "unidade",
                                    e.target.value
                                  )
                                }
                                placeholder="Un"
                                className="bg-[#111827] border border-white/10 hover:border-white/30 focus:border-cyan-400 rounded-lg px-3 py-2 w-full outline-none"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                step="any"
                                value={item.quantidade}
                                onChange={(e) =>
                                  updateOrcamento(
                                    item.id,
                                    "quantidade",
                                    e.target.value
                                  )
                                }
                                className="bg-[#111827] border border-white/10 hover:border-white/30 focus:border-cyan-400 rounded-lg px-2 py-2 w-full outline-none text-center"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                step="any"
                                value={item.ocorrencia}
                                onChange={(e) =>
                                  updateOrcamento(
                                    item.id,
                                    "ocorrencia",
                                    e.target.value
                                  )
                                }
                                className="bg-[#111827] border border-white/10 hover:border-white/30 focus:border-cyan-400 rounded-lg px-2 py-2 w-full outline-none text-center"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                step="any"
                                value={item.valorUnitario}
                                onChange={(e) =>
                                  updateOrcamento(
                                    item.id,
                                    "valorUnitario",
                                    e.target.value
                                  )
                                }
                                className="bg-[#111827] border border-white/10 hover:border-white/30 focus:border-cyan-400 rounded-lg px-3 py-2 w-full outline-none"
                              />
                            </td>
                            <td className="py-2 px-4 text-right font-medium text-gray-300">
                              {formatMoney(calcularTotalLinha(item))}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                onClick={() => removerLinhaOrcamento(item.id)}
                                className="text-white bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded p-1.5 transition-colors shadow-sm inline-flex items-center justify-center opacity-0 group-hover:opacity-100"
                                title="Excluir Item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}

                      {itensEtapa.length > 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-2 text-center border-b border-white/5"
                          >
                            <button
                              onClick={() => adicionarLinhaOrcamento(etapa)}
                              className="text-xs text-gray-500 hover:text-cyan-400 transition-colors py-1 px-4 border border-dashed border-gray-600 hover:border-cyan-400 rounded-full"
                            >
                              + Adicionar item em {etapa}
                            </button>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  const renderExportar = () => (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center max-w-2xl mx-auto space-y-8">
      <div>
        <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
          <Download size={36} className="text-white" />
        </div>
        <h2 className="text-3xl font-black mb-3">Exportar e Imprimir</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Gere arquivos PDF otimizados e seguros para as plataformas
          governamentais. Garantia de formatação impecável.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <button
          onClick={() => setPrintMode("full")}
          className="bg-[#0F172A] border border-white/10 hover:border-cyan-400 transition-colors p-6 rounded-3xl flex flex-col items-center text-center group shadow-xl"
        >
          <Printer
            size={32}
            className="text-cyan-400 mb-4 group-hover:scale-110 transition-transform"
          />
          <h4 className="font-bold text-lg mb-1 text-white">
            Projeto Completo (PDF)
          </h4>
          <p className="text-xs text-gray-400">
            Texto Base Institucional, Ficha Técnica e Planilha Unidos.
          </p>
        </button>

        <button
          onClick={() => setPrintMode("sheet")}
          className="bg-[#0F172A] border border-white/10 hover:border-green-400 transition-colors p-6 rounded-3xl flex flex-col items-center text-center group shadow-xl"
        >
          <TableIcon
            size={32}
            className="text-green-400 mb-4 group-hover:scale-110 transition-transform"
          />
          <h4 className="font-bold text-lg mb-1 text-white">
            Apenas Planilha (PDF)
          </h4>
          <p className="text-xs text-gray-400">
            Módulo financeiro estruturado com cálculos totais.
          </p>
        </button>
      </div>
    </div>
  );

  const renderChatIA = () => (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-180px)]">
      <div className="bg-[#0F172A] border border-white/10 rounded-3xl p-5 shadow-xl flex flex-col h-full">
        <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Zap className="text-yellow-400" size={24} /> Análise IA & Chat
            Especialista
          </h3>
          <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full font-medium">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>{" "}
            Online
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 flex flex-col">
          {chat.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.startsWith("Você:")
                  ? "bg-gradient-to-br from-cyan-600 to-blue-600 text-white self-end rounded-tr-sm shadow-md"
                  : "bg-white/5 text-gray-200 self-start rounded-tl-sm border border-white/5"
              }`}
            >
              {msg}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col gap-3">
          <button
            onClick={realizarAnaliseIA}
            disabled={isAnalyzing}
            className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-colors ${
              isAnalyzing
                ? "bg-slate-700 text-slate-400"
                : "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20"
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Auditando
                Porcentagens Financeiras...
              </>
            ) : (
              <>
                <BarChart size={18} /> Analisar Viabilidade e Limites da
                Planilha Atual
              </>
            )}
          </button>

          <div className="relative">
            <input
              value={mensagemIA}
              onChange={(e) => setMensagemIA(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendIA()}
              placeholder="Ex: Como posso justificar a rubrica de Captação?"
              className="w-full bg-[#111827] border border-white/10 focus:border-cyan-500/50 rounded-xl pl-5 pr-14 py-3 outline-none text-sm transition-colors text-white"
            />
            <button
              onClick={handleSendIA}
              disabled={!mensagemIA.trim()}
              className="absolute right-2 top-1.5 p-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg hover:scale-105 disabled:opacity-50"
            >
              <Send size={16} className="text-white ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "Dados Iniciais":
        return renderDadosIniciais();
      case "Ficha Técnica":
        return renderFichaTecnica();
      case "Orçamento do Projeto":
        return renderOrcamento();
      case "Análise IA / Chat":
        return renderChatIA();
      case "Exportar":
        return renderExportar();
      default:
        return renderDadosIniciais();
    }
  };

  if (printMode) {
    return (
      <div className="bg-white text-black min-h-screen font-sans">
        <div className="print:hidden bg-slate-800 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPrintMode(null)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-2 font-medium transition-colors"
            >
              <ArrowLeft size={18} /> Voltar ao Sistema
            </button>
            <span className="text-slate-300 text-sm">
              Visualização de Impressão (
              {printMode === "full" ? "Projeto Completo" : "Apenas Planilha"})
            </span>
          </div>
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-cyan-500/30"
          >
            <Printer size={20} /> Salvar PDF
          </button>
        </div>

        <div className="p-10 max-w-5xl mx-auto">
          <div className="border-b-2 border-black pb-4 mb-8">
            <h1 className="text-3xl font-black uppercase mb-1">
              {nomeProjeto || "Projeto Cultural Em Desenvolvimento"}
            </h1>
            <p className="text-sm text-gray-600">
              Localização Base: {cidade || "Não informado"}
            </p>
          </div>

          {printMode === "full" && projetoGerado && (
            <div className="mb-10 text-justify text-base leading-relaxed space-y-6 text-slate-800 break-words">
              <div>
                <h2 className="text-xl font-bold bg-gray-200 px-4 py-2 mb-3 uppercase">
                  1. Resumo da Obra
                </h2>
                <p className="px-4">{projetoGerado.resumo}</p>
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gray-200 px-4 py-2 mb-3 uppercase">
                  2. Justificativa
                </h2>
                <p className="px-4 whitespace-pre-wrap">
                  {projetoGerado.justificativa}
                </p>
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gray-200 px-4 py-2 mb-3 uppercase">
                  3. Objetivos
                </h2>
                <div className="px-4">
                  <p className="mb-2">
                    <strong>Geral:</strong> {projetoGerado.objetivos.geral}
                  </p>
                  <p className="font-bold">Específicos:</p>
                  <ul className="list-disc pl-6">
                    {projetoGerado.objetivos.especificos.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="break-inside-avoid">
                <h2 className="text-xl font-bold bg-gray-200 px-4 py-2 mb-3 uppercase">
                  4. Ficha Técnica Vinculada
                </h2>
                {equipeProjeto.length === 0 ? (
                  <p className="text-sm px-4 italic">
                    Nenhum profissional vinculado.
                  </p>
                ) : (
                  <ul className="space-y-3 px-4">
                    {equipeProjeto.map((membro) => (
                      <li
                        key={membro.id}
                        className="border-b border-gray-200 pb-2"
                      >
                        <p className="font-bold text-base uppercase">
                          {membro.funcao}: {membro.nome}
                        </p>
                        <p className="text-xs text-gray-600">
                          CPF/CNPJ: {membro.documento} | Contato:{" "}
                          {membro.telefone}
                        </p>
                        {membro.portfolioTexto && (
                          <p className="text-sm mt-1">
                            "{membro.portfolioTexto}"
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          <div className="mb-10 page-break-before-auto">
            <h2 className="text-xl font-bold bg-gray-200 px-4 py-2 mb-4 uppercase">
              Planilha Orçamentária
            </h2>
            <table className="w-full text-left border-collapse border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-3 border border-gray-300 font-bold">
                    Item de Despesa
                  </th>
                  <th className="py-2 px-3 border border-gray-300 font-bold text-center">
                    Unid.
                  </th>
                  <th className="py-2 px-3 border border-gray-300 font-bold text-center">
                    Qtd
                  </th>
                  <th className="py-2 px-3 border border-gray-300 font-bold text-center">
                    Oc.
                  </th>
                  <th className="py-2 px-3 border border-gray-300 font-bold text-right">
                    V. Unit
                  </th>
                  <th className="py-2 px-3 border border-gray-300 font-bold text-right">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {etapasProjeto.map((etapa) => {
                  const itensEtapa = orcamento.filter(
                    (item) => item.etapa === etapa
                  );
                  if (itensEtapa.length === 0) return null;
                  const totalEtapa = itensEtapa.reduce(
                    (acc, item) => acc + calcularTotalLinha(item),
                    0
                  );
                  return (
                    <React.Fragment key={`print-${etapa}`}>
                      <tr className="bg-gray-200/60 break-inside-avoid">
                        <td
                          colSpan={5}
                          className="py-2 px-3 border border-gray-300 font-bold uppercase text-xs"
                        >
                          {etapa}
                        </td>
                        <td className="py-2 px-3 border border-gray-300 font-bold text-right">
                          {formatMoney(totalEtapa)}
                        </td>
                      </tr>
                      {itensEtapa.map((item) => (
                        <tr key={item.id} className="break-inside-avoid">
                          <td className="py-2 px-3 border border-gray-300 break-words max-w-[300px]">
                            {item.item || "-"}
                          </td>
                          <td className="py-2 px-3 border border-gray-300 text-center">
                            {item.unidade}
                          </td>
                          <td className="py-2 px-3 border border-gray-300 text-center">
                            {item.quantidade}
                          </td>
                          <td className="py-2 px-3 border border-gray-300 text-center">
                            {item.ocorrencia}
                          </td>
                          <td className="py-2 px-3 border border-gray-300 text-right">
                            {formatMoney(item.valorUnitario)}
                          </td>
                          <td className="py-2 px-3 border border-gray-300 text-right font-medium">
                            {formatMoney(calcularTotalLinha(item))}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
                <tr className="bg-gray-300 break-inside-avoid">
                  <td
                    colSpan={5}
                    className="py-3 px-3 border border-gray-400 text-right font-black uppercase"
                  >
                    Valor Total do Projeto:
                  </td>
                  <td className="py-3 px-3 border border-gray-400 text-right font-black text-base">
                    {formatMoney(calcularTotalGeral())}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (
    authError === "auth/configuration-not-found" ||
    authError === "auth/operation-not-allowed" ||
    authError.includes("auth")
  ) {
    return (
      <div className="min-h-screen bg-[#070B17] text-white flex flex-col items-center justify-center font-sans p-8 text-center">
        <AlertTriangle size={64} className="text-red-500 mb-6" />
        <h2 className="text-3xl font-black mb-4">
          Autenticação Desativada no Firebase
        </h2>
        <p className="text-gray-400 mb-6 max-w-lg leading-relaxed">
          O aplicativo ligou-se ao seu Firebase, mas a{" "}
          <b>Autenticação Anónima</b> ainda não foi ativada no seu painel.
        </p>
        <div className="bg-[#0F172A] border border-white/10 p-6 rounded-3xl text-left max-w-3xl w-full text-sm text-gray-300 shadow-xl space-y-4">
          <p className="font-bold text-white text-lg border-b border-white/10 pb-2">
            Como resolver agora mesmo:
          </p>
          <p>
            <b>1.</b> Vá ao painel do Firebase:{" "}
            <a
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 underline"
            >
              console.firebase.google.com
            </a>
          </p>
          <p>
            <b>2.</b> No menu esquerdo, clique em <b>Build (Criação)</b> e
            depois em <b>Authentication (Autenticação)</b>.
          </p>
          <p>
            <b>3.</b> Clique no botão azul gigante{" "}
            <b>Vamos começar (Get Started)</b>.
          </p>
          <p>
            <b>4.</b> Na aba <b>Sign-in method (Método de login)</b>, desça até
            encontrar a opção <b>Anonymous (Anónimo)</b>.
          </p>
          <p>
            <b>5.</b> Ative o interruptor e clique em <b>Salvar</b>.
          </p>
          <p className="pt-3 text-yellow-400 font-medium">
            Após salvar lá, basta recarregar esta página (F5) e tudo funcionará!
          </p>
        </div>
      </div>
    );
  }

  if (!isDataLoaded && user) {
    return (
      <div className="min-h-screen bg-[#070B17] text-white flex flex-col items-center justify-center font-sans">
        <Loader2 size={48} className="animate-spin text-cyan-500 mb-6" />
        <h2 className="text-2xl font-black mb-2 tracking-tight bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
          CÉREBRO 2.0
        </h2>
        <p className="text-gray-400 font-medium">
          Buscando seu projeto salvo na nuvem...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B17] text-white flex flex-col font-sans">
      <header className="h-20 border-b border-white/10 bg-[#0B1220]/90 backdrop-blur-xl flex items-center justify-between px-6 lg:px-10 shrink-0">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
              CÉREBRO 2.0
            </h1>
            <p className="text-xs text-gray-400 font-medium">
              Gestão Cultural IA
            </p>
          </div>
          <div className="hidden md:block h-8 w-px bg-white/10 mx-2"></div>
          <div className="hidden md:block">
            <h2 className="text-lg font-bold text-white leading-tight">
              Painel do Projeto
            </h2>
            <p className="text-xs text-gray-400">
              Edital PIC • Leis de Incentivo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {lastSaved && (
            <span className="text-xs text-gray-500 hidden sm:block">
              Último salvamento: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleSaveWorkspace}
            disabled={isSaving || !isDataLoaded}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-colors text-sm font-bold disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin text-cyan-400" />
            ) : (
              <Save size={16} className="text-cyan-400" />
            )}
            <span className="hidden sm:inline">
              {isSaving ? "Salvando..." : "Salvar Projeto"}
            </span>
          </button>
        </div>
      </header>

      <div className="bg-[#0B1220]/50 border-b border-white/10 px-6 lg:px-10 shrink-0">
        <div className="flex gap-2 overflow-x-auto py-4 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-xl transition text-sm font-medium ${
                activeTab === tab
                  ? "bg-gradient-to-r from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/20 text-white"
                  : "bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
}
