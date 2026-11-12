/* =====================================================================
   Restaurante Yemanjá (Armação, Salvador) — dados da casa + "banco" do modo demo.
   ÚNICO lugar com informação do restaurante. Site, página de visitantes e painel leem daqui.
   Modo demo: tudo fica no navegador (localStorage, prefixo yj_).
   O que o gerente muda no painel aparece no site do mesmo aparelho.
   Regra: nada de preço, endereço ou ano inventado. preco: null = "consulte no salão".
   ===================================================================== */
(function () {
  'use strict';

  var CASA = {
    nome: 'Yemanjá',
    nomeCompleto: 'Restaurante Yemanjá',
    slogan: 'Tradição em frutos do mar',            // da marca (foto de perfil)
    bio: 'A melhor culinária da Bahia em Armação.', // bio do Instagram
    anos: 52,                                        // "celebrando 52 anos de história" (legenda, nov/2026)
    bairro: 'Armação · Salvador/BA',
    endereco: '',                                    // A CONFIRMAR: rua e número. Enquanto vazio, o site mostra só o bairro.
    mapa: 'Restaurante Yemanjá, Armação, Salvador, BA', // busca no Google Maps (não é endereço inventado)
    // REAL: bio do Instagram "Reservas e informações 71 99698 5181"
    whatsapp: '5571996985181',
    whatsappTxt: '(71) 99698-5181',
    instagram: 'restauranteyemanja',
    // bio: "Domingo à Sábado de 11:30 às 17:00". 0 = domingo.
    horario: { dias: [0, 1, 2, 3, 4, 5, 6], abre: '11:30', fecha: '17:00', txt: 'Todos os dias, das 11h30 às 17h' }
  };

  var CATEGORIAS = [
    { id: 'baianos', nome: 'Clássicos da Bahia', nota: 'Dendê, leite de coco e folha de bananeira.' },
    { id: 'mar',     nome: 'Do mar',             nota: 'Camarão, siri e peixe.' },
    { id: 'massas',  nome: 'Massas',             nota: 'Para quem quer frutos do mar fora da panela de barro.' }
  ];

  // Pratos citados nas legendas do Instagram. preco: null = "consulte" (A CONFIRMAR).
  // foto: arquivo em fotos/ (recorte de post da casa). frase: palavras da própria legenda, quando há.
  var CARDAPIO = [
    { id: 'abara',     cat: 'baianos', nome: 'Abará com vatapá e camarões', desc: 'Abará na folha de bananeira, vatapá e camarões secos.', frase: 'Hoje pede um prato que abraça.', foto: 'abara-vatapa-camarao.jpg', preco: null, destaque: true },
    { id: 'moqueca',   cat: 'baianos', nome: 'Moquecas',                    desc: 'Na panela de barro. Sabores do dia: pergunte ao garçom.', frase: 'O sabor do mar com a essência da Bahia.', foto: 'mar-bahia.jpg', preco: null, destaque: true },
    { id: 'peixe-banana', cat: 'baianos', nome: 'Peixe com banana-da-terra', desc: 'Peixe do dia com banana-da-terra.', frase: '', foto: '', preco: null },
    { id: 'moranga',   cat: 'mar',     nome: 'Camarão na moranga',          desc: 'Servido dentro da abóbora.', frase: '', foto: 'moranga.jpg', preco: null, destaque: true },
    { id: 'siri',      cat: 'mar',     nome: 'Casquinha de siri',           desc: 'Com farofa fina e pimenta.', frase: 'Sabor que se destaca.', foto: 'siri.jpg', preco: null, destaque: true },
    { id: 'camarao',   cat: 'mar',     nome: 'Camarões',                    desc: 'Camarão temperado, do jeito da casa.', frase: '', foto: 'camaroes.jpg', preco: null },
    { id: 'fettuccine',cat: 'massas',  nome: 'Fettuccine com camarão',      desc: 'Massa longa com molho cremoso e camarão.', frase: '', foto: 'fettuccine-camarao.jpg', preco: null, destaque: true }
  ];

  var TIPOS_RESERVA = [
    { id: 'mesa',   nome: 'Mesa',                     en: 'Table',        es: 'Mesa' },
    { id: 'grupo',  nome: 'Grupo (8 pessoas ou mais)', en: 'Group',        es: 'Grupo' },
    { id: 'evento', nome: 'Grupo de congresso / evento', en: 'Conference group', es: 'Grupo de congreso' },
    { id: 'festa',  nome: 'Aniversário ou comemoração', en: 'Celebration',  es: 'Celebración' }
  ];

  /* ---------------- datas ---------------- */
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function deIso(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function hoje() { return iso(new Date()); }
  function soma(s, n) { var d = deIso(s); d.setDate(d.getDate() + n); return iso(d); }
  var SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var MES_C = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var MES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ---------------- armazenamento ---------------- */
  var PFX = 'yj_';
  function le(k, pad) { try { var v = localStorage.getItem(PFX + k); return v ? JSON.parse(v) : pad; } catch (e) { return pad; } }
  function grava(k, v) { try { localStorage.setItem(PFX + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function novoId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ---------------- dados de exemplo ---------------- */
  function semear(forcar) {
    var VERSAO = 'semeado_v1';
    if (!forcar) { try { if (localStorage.getItem(PFX + VERSAO)) return; } catch (e) { return; } }
    var h = hoje();
    grava('cardapio', CARDAPIO.map(function (i) { return Object.assign({ disponivel: true }, i); }));

    // Agenda do Centro de Convenções: EXEMPLOS (nomes e datas inventados, marcados "exemplo").
    // A casa posta a agenda real todo mês ("Novembro de congressos no Centro de Convenções"): o gerente cadastra no painel.
    grava('eventos', [
      { id: novoId(), nome: 'Congresso de medicina (exemplo)',   inicio: soma(h, 2),  fim: soma(h, 4),  publico: 'Médicos e residentes', obs: '' },
      { id: novoId(), nome: 'Feira de negócios (exemplo)',       inicio: soma(h, 9),  fim: soma(h, 11), publico: 'Expositores e visitantes', obs: '' },
      { id: novoId(), nome: 'Encontro de educação (exemplo)',    inicio: soma(h, 16), fim: soma(h, 17), publico: 'Professores', obs: '' },
      { id: novoId(), nome: 'Simpósio de odontologia (exemplo)', inicio: soma(h, 23), fim: soma(h, 25), publico: 'Dentistas e estudantes', obs: '' }
    ]);

    var t = new Date().toISOString();
    grava('reservas', [
      { id: novoId(), tipo: 'evento', data: h, hora: '12:30', pessoas: 16, nome: 'Grupo do congresso (exemplo)', tel: '71900000001', evento: 'Congresso de medicina (exemplo)', idioma: 'pt', obs: 'Saem do Centro de Convenções no intervalo do almoço.', status: 'confirmada', criado: t },
      { id: novoId(), tipo: 'mesa',   data: h, hora: '13:00', pessoas: 4,  nome: 'Família Souza (exemplo)',     tel: '71900000002', evento: '', idioma: 'pt', obs: '', status: 'nova', criado: t },
      { id: novoId(), tipo: 'festa',  data: soma(h, 1), hora: '12:00', pessoas: 10, nome: 'Aniversário da vó (exemplo)', tel: '71900000003', evento: '', idioma: 'pt', obs: '90 anos. Mesa perto da janela.', status: 'nova', criado: t },
      { id: novoId(), tipo: 'mesa',   data: soma(h, 2), hora: '12:30', pessoas: 2,  nome: 'John (exemplo)',             tel: '1555000000',  evento: '', idioma: 'en', obs: 'Veio pela página em inglês.', status: 'nova', criado: t }
    ]);
    try { localStorage.setItem(PFX + VERSAO, '1'); } catch (e) { /* sem armazenamento */ }
  }

  /* ---------------- consultas ---------------- */
  function cardapio() { return le('cardapio', CARDAPIO.map(function (i) { return Object.assign({ disponivel: true }, i); })); }
  function eventos() { return le('eventos', []).slice().sort(function (a, b) { return a.inicio.localeCompare(b.inicio); }); }
  function proximosEventos() { var h = hoje(); return eventos().filter(function (e) { return (e.fim || e.inicio) >= h; }); }
  function reservas() { return le('reservas', []); }
  function addReserva(r) {
    var lista = reservas();
    r.id = novoId(); r.status = r.status || 'nova'; r.criado = new Date().toISOString();
    lista.push(r); grava('reservas', lista); return r;
  }

  function toMin(t) { var p = t.split(':'); return (+p[0]) * 60 + (+p[1]); }
  function aberto(agora) {
    agora = agora || new Date();
    var m = agora.getHours() * 60 + agora.getMinutes(), h = CASA.horario;
    if (h.dias.indexOf(agora.getDay()) < 0) return { aberto: false, txt: 'Fechado hoje' };
    if (m >= toMin(h.abre) && m < toMin(h.fecha)) return { aberto: true, txt: 'Aberto agora · até as 17h' };
    if (m < toMin(h.abre)) return { aberto: false, txt: 'Abre hoje às 11h30' };
    return { aberto: false, txt: 'Fechado agora · abre amanhã às 11h30' };
  }

  function reais(v) {
    if (v == null || v === '' || isNaN(v)) return '';
    var n = Number(v);
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function dataCurta(s) { var d = deIso(s); return String(d.getDate()).padStart(2, '0') + ' ' + MES_C[d.getMonth()]; }
  function dataLonga(s) { var d = deIso(s); return SEMANA[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()]; }
  function periodo(e) {
    if (!e.fim || e.fim === e.inicio) return dataCurta(e.inicio);
    var a = deIso(e.inicio), b = deIso(e.fim);
    if (a.getMonth() === b.getMonth()) return a.getDate() + ' a ' + b.getDate() + ' ' + MES_C[b.getMonth()];
    return dataCurta(e.inicio) + ' a ' + dataCurta(e.fim);
  }
  function periodoEn(e) {
    var a = deIso(e.inicio), b = deIso(e.fim || e.inicio);
    return MES_EN[a.getMonth()] + ' ' + a.getDate() + (e.fim && e.fim !== e.inicio ? '–' + (a.getMonth() === b.getMonth() ? '' : MES_EN[b.getMonth()] + ' ') + b.getDate() : '');
  }
  function linkWa(txt) { return 'https://wa.me/' + CASA.whatsapp + '?text=' + encodeURIComponent(txt); }
  function linkMapa(destino) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(destino || CASA.mapa); }
  function linkRota(origem) { return 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(origem) + '&destination=' + encodeURIComponent(CASA.mapa); }
  function nomeTipo(id) { return (TIPOS_RESERVA.filter(function (t) { return t.id === id; })[0] || {}).nome || id; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  semear(false);

  window.YJ = {
    CASA: CASA, CATEGORIAS: CATEGORIAS, TIPOS_RESERVA: TIPOS_RESERVA, MESES: MESES,
    iso: iso, deIso: deIso, hoje: hoje, soma: soma,
    le: le, grava: grava, novoId: novoId, semear: semear,
    cardapio: cardapio, eventos: eventos, proximosEventos: proximosEventos,
    reservas: reservas, addReserva: addReserva, aberto: aberto,
    reais: reais, dataCurta: dataCurta, dataLonga: dataLonga, periodo: periodo, periodoEn: periodoEn,
    linkWa: linkWa, linkMapa: linkMapa, linkRota: linkRota, nomeTipo: nomeTipo, esc: esc
  };
})();
