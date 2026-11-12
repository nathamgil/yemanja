/* Painel do Restaurante Yemanjá — modo demo (localStorage). Login é só porta de vitrine. */
(function () {
  'use strict';
  var esc = YJ.esc;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var corpo = $('#corpo');
  var estado = { aba: new URLSearchParams(location.search).get('aba') || 'reservas', filtro: 'hoje', editItem: null, editEv: null };

  /* ---------- login ---------- */
  function entrar() { $('#tela-login').hidden = true; $('#tela-painel').hidden = false; aba(estado.aba); }
  try { if (sessionStorage.getItem('yj_logado')) entrar(); } catch (e) { /* */ }
  $('#form-login').addEventListener('submit', function (e) {
    e.preventDefault();
    if ($('#l-user').value.trim().toLowerCase() === 'gerente' && $('#l-senha').value === 'yemanja') {
      try { sessionStorage.setItem('yj_logado', '1'); } catch (er) { /* */ }
      entrar();
    } else $('#login-erro').innerHTML = '<p class="erro">Usuário ou senha não conferem. Use os dados de demonstração acima.</p>';
  });
  $('#sair').addEventListener('click', function () { try { sessionStorage.removeItem('yj_logado'); } catch (e) { /* */ } location.reload(); });

  $$('.adm-abas button').forEach(function (b) { b.addEventListener('click', function () { aba(b.getAttribute('data-aba')); }); });
  function aba(id) {
    estado.aba = id;
    $$('.adm-abas button').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-aba') === id); });
    ({ reservas: reservas, cardapio: cardapio, eventos: eventos, ajustes: ajustes }[id] || reservas)();
    window.scrollTo(0, 0);
  }

  /* ---------- reservas ---------- */
  var ST = ['nova', 'confirmada', 'chegou', 'cancelada'];
  var ST_NOME = { nova: 'Nova', confirmada: 'Confirmada', chegou: 'Chegou', cancelada: 'Cancelada' };
  function reservas() {
    var todas = YJ.reservas(), h = YJ.hoje();
    var ativas = todas.filter(function (r) { return r.status !== 'cancelada'; });
    var deHoje = ativas.filter(function (r) { return r.data === h; });
    var lista = todas.filter(function (r) {
      if (estado.filtro === 'hoje') return r.data === h;
      if (estado.filtro === 'proximas') return r.data > h;
      if (estado.filtro === 'grupos') return (r.tipo === 'grupo' || r.tipo === 'evento') && r.data >= h;
      return true;
    }).sort(function (a, b) { return (a.data + a.hora).localeCompare(b.data + b.hora); });
    corpo.innerHTML =
      '<h2>Reservas</h2>' +
      '<div class="resumo"><div><b>' + deHoje.length + '</b>reservas hoje</div><div><b>' + deHoje.reduce(function (s, r) { return s + (+r.pessoas || 0); }, 0) + '</b>pessoas hoje</div><div><b>' + ativas.filter(function (r) { return r.status === 'nova'; }).length + '</b>para confirmar</div></div>' +
      '<div class="filtros">' + [['hoje', 'Hoje'], ['proximas', 'Próximos dias'], ['grupos', 'Grupos e congressos'], ['todas', 'Todas']].map(function (f) { return '<button type="button" data-f="' + f[0] + '" aria-pressed="' + (estado.filtro === f[0]) + '">' + f[1] + '</button>'; }).join('') + '</div>' +
      '<div class="caixa">' + (lista.length ? lista.map(function (r) {
        var msg = 'Olá, ' + r.nome.replace(/ \(exemplo\)$/, '') + '! Aqui é do Restaurante Yemanjá. Sua reserva para ' + r.pessoas + ' pessoas em ' + YJ.dataLonga(r.data) + ', às ' + r.hora + ', está confirmada. Até lá!';
        return '<div class="linha-adm"><div><div class="t">' + r.hora + ' · ' + esc(r.nome) + ' · ' + r.pessoas + ' pessoas <span class="selo-st st-' + r.status + '">' + ST_NOME[r.status] + '</span></div>' +
          '<div class="s">' + YJ.dataLonga(r.data) + ' · ' + esc(YJ.nomeTipo(r.tipo)) + (r.evento ? ' · ' + esc(r.evento) : '') + (r.idioma && r.idioma !== 'pt' ? ' · fala ' + (r.idioma === 'es' ? 'espanhol' : 'inglês') : '') + (r.obs ? '<br>' + esc(r.obs) : '') + '</div></div>' +
          '<div class="acoes">' + ST.filter(function (s) { return s !== r.status; }).map(function (s) { return '<button class="mini-bt' + (s === 'confirmada' ? ' forte' : s === 'cancelada' ? ' perigo' : '') + '" data-st="' + s + '" data-id="' + r.id + '">' + ST_NOME[s] + '</button>'; }).join('') +
          (r.tel ? '<a class="mini-bt" target="_blank" rel="noopener" href="https://wa.me/' + (r.tel.length <= 11 ? '55' : '') + r.tel + '?text=' + encodeURIComponent(msg) + '">WhatsApp</a>' : '') + '</div></div>';
      }).join('') : '<p>Nenhuma reserva aqui.</p>') + '</div>' +
      '<div class="caixa"><h3>Anotar reserva que chegou por telefone</h3><form class="form-adm" id="f-res">' +
      '<div class="campo"><label for="a-nome">Nome</label><input type="text" id="a-nome" required></div>' +
      '<div class="campo"><label for="a-tel">WhatsApp (só números)</label><input type="tel" id="a-tel" inputmode="numeric"></div>' +
      '<div class="campo"><label for="a-tipo">Tipo</label><select id="a-tipo">' + YJ.TIPOS_RESERVA.map(function (t) { return '<option value="' + t.id + '">' + t.nome + '</option>'; }).join('') + '</select></div>' +
      '<div class="campo"><label for="a-pessoas">Pessoas</label><input type="number" id="a-pessoas" min="1" value="2"></div>' +
      '<div class="campo"><label for="a-data">Dia</label><input type="date" id="a-data" value="' + h + '"></div>' +
      '<div class="campo"><label for="a-hora">Hora</label><input type="text" id="a-hora" value="12:30" inputmode="numeric"></div>' +
      '<div class="campo todo"><label for="a-obs">Observação</label><input type="text" id="a-obs"></div>' +
      '<div class="todo"><button class="bt bt-cheio" type="submit">Salvar reserva</button></div></form></div>';
    $$('[data-f]').forEach(function (b) { b.addEventListener('click', function () { estado.filtro = b.getAttribute('data-f'); reservas(); }); });
    $$('[data-st]').forEach(function (b) {
      b.addEventListener('click', function () {
        var l = YJ.reservas(); l.forEach(function (r) { if (r.id === b.getAttribute('data-id')) r.status = b.getAttribute('data-st'); });
        YJ.grava('reservas', l); reservas();
      });
    });
    $('#f-res').addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = $('#a-nome').value.trim(); if (!nome) { $('#a-nome').focus(); return; }
      YJ.addReserva({ tipo: $('#a-tipo').value, data: $('#a-data').value || h, hora: $('#a-hora').value || '12:30', pessoas: +$('#a-pessoas').value || 1, nome: nome, tel: $('#a-tel').value.replace(/\D/g, ''), evento: '', idioma: 'pt', obs: $('#a-obs').value.trim(), status: 'confirmada' });
      reservas();
    });
  }

  /* ---------- cardápio ---------- */
  function cardapio() {
    var itens = YJ.cardapio(), ed = estado.editItem;
    var item = ed === 'novo' ? { id: '', cat: 'mar', nome: '', desc: '', frase: '', foto: '', preco: null, disponivel: true, destaque: false } : itens.filter(function (i) { return i.id === ed; })[0];
    corpo.innerHTML = '<h2>Cardápio</h2><p>Toque em <b>Hoje não tem</b> quando um prato acabar: ele aparece riscado no site na hora. Preço em branco mostra "preço no salão".</p>' +
      (item ? formItem(item) : '<p><button class="bt bt-cheio" id="novo-item" type="button">Adicionar prato</button></p>') +
      YJ.CATEGORIAS.map(function (c) {
        return '<div class="caixa"><h3>' + c.nome + '</h3>' + itens.filter(function (i) { return i.cat === c.id; }).map(function (i) {
          return '<div class="linha-adm"><div><div class="t">' + esc(i.nome) + (i.disponivel === false ? ' <span class="selo-st st-nova">hoje não tem</span>' : '') + (i.destaque ? ' <span class="selo-st st-confirmada">na página inicial</span>' : '') + '</div>' +
            '<div class="s">' + (YJ.reais(i.preco) || 'preço a confirmar') + ' · ' + esc(i.desc) + '</div></div>' +
            '<div class="acoes"><button class="mini-bt' + (i.disponivel === false ? ' forte' : '') + '" data-disp="' + i.id + '">' + (i.disponivel === false ? 'Voltou' : 'Hoje não tem') + '</button><button class="mini-bt" data-edit="' + i.id + '">Editar</button></div></div>';
        }).join('') + '</div>';
      }).join('');
    var n = $('#novo-item'); if (n) n.addEventListener('click', function () { estado.editItem = 'novo'; cardapio(); });
    $$('[data-disp]').forEach(function (b) { b.addEventListener('click', function () { var l = YJ.cardapio(); l.forEach(function (i) { if (i.id === b.getAttribute('data-disp')) i.disponivel = i.disponivel === false; }); YJ.grava('cardapio', l); cardapio(); }); });
    $$('[data-edit]').forEach(function (b) { b.addEventListener('click', function () { estado.editItem = b.getAttribute('data-edit'); cardapio(); }); });
    var f = $('#f-item');
    if (f) {
      $('#cancela-item').addEventListener('click', function () { estado.editItem = null; cardapio(); });
      var ex = $('#exclui-item'); if (ex) ex.addEventListener('click', function () { if (!confirm('Tirar este prato do cardápio?')) return; YJ.grava('cardapio', YJ.cardapio().filter(function (i) { return i.id !== item.id; })); estado.editItem = null; cardapio(); });
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var nome = $('#i-nome').value.trim(); if (!nome) { $('#i-nome').focus(); return; }
        var pr = $('#i-preco').value.replace(',', '.').trim();
        var novo = Object.assign({}, item, { cat: $('#i-cat').value, nome: nome, desc: $('#i-desc').value.trim(), frase: $('#i-frase').value.trim(), preco: pr === '' || isNaN(pr) ? null : +pr, destaque: $('#i-dest').checked });
        var l = YJ.cardapio();
        if (!novo.id) { novo.id = YJ.novoId(); l.push(novo); } else l = l.map(function (i) { return i.id === novo.id ? novo : i; });
        YJ.grava('cardapio', l); estado.editItem = null; cardapio();
      });
    }
  }
  function formItem(i) {
    return '<div class="caixa"><h3>' + (i.id ? 'Editar prato' : 'Novo prato') + '</h3><form class="form-adm" id="f-item">' +
      '<div class="campo"><label for="i-nome">Nome</label><input type="text" id="i-nome" value="' + esc(i.nome) + '"></div>' +
      '<div class="campo"><label for="i-cat">Seção</label><select id="i-cat">' + YJ.CATEGORIAS.map(function (c) { return '<option value="' + c.id + '"' + (c.id === i.cat ? ' selected' : '') + '>' + c.nome + '</option>'; }).join('') + '</select></div>' +
      '<div class="campo todo"><label for="i-desc">Descrição</label><input type="text" id="i-desc" value="' + esc(i.desc) + '"></div>' +
      '<div class="campo"><label for="i-frase">Frase (opcional)</label><input type="text" id="i-frase" value="' + esc(i.frase) + '"></div>' +
      '<div class="campo"><label for="i-preco">Preço em R$ (em branco = "preço no salão")</label><input type="text" id="i-preco" inputmode="decimal" value="' + (i.preco == null ? '' : i.preco) + '"></div>' +
      '<div class="campo todo"><label class="check"><input type="checkbox" id="i-dest"' + (i.destaque ? ' checked' : '') + '> Mostrar na página inicial (precisa ter foto)</label></div>' +
      '<div class="todo" style="display:flex;gap:10px;flex-wrap:wrap"><button class="bt bt-cheio" type="submit">Salvar</button><button class="bt" type="button" id="cancela-item">Cancelar</button>' + (i.id ? '<button class="mini-bt perigo" type="button" id="exclui-item">Tirar do cardápio</button>' : '') + '</div></form></div>';
  }

  /* ---------- agenda de eventos (Centro de Convenções) ---------- */
  function eventos() {
    var evs = YJ.eventos(), h = YJ.hoje(), ed = estado.editEv;
    var ev = ed === 'novo' ? { id: '', nome: '', inicio: h, fim: h, publico: '', obs: '' } : evs.filter(function (e) { return e.id === ed; })[0];
    corpo.innerHTML = '<h2>Agenda do Centro de Convenções</h2><p>Os eventos que entram aqui aparecem no site (página inicial, página "Centro de Convenções" e na lista da reserva de grupo). Mesma agenda que vocês postam no Instagram todo mês.</p>' +
      (ev ? '<div class="caixa"><h3>' + (ev.id ? 'Editar evento' : 'Novo evento') + '</h3><form class="form-adm" id="f-ev">' +
        '<div class="campo todo"><label for="e-nome">Nome do evento</label><input type="text" id="e-nome" value="' + esc(ev.nome) + '"></div>' +
        '<div class="campo"><label for="e-ini">Começa</label><input type="date" id="e-ini" value="' + ev.inicio + '"></div>' +
        '<div class="campo"><label for="e-fim">Termina</label><input type="date" id="e-fim" value="' + (ev.fim || ev.inicio) + '"></div>' +
        '<div class="campo"><label for="e-pub">Público</label><input type="text" id="e-pub" value="' + esc(ev.publico) + '" placeholder="Ex.: médicos, professores"></div>' +
        '<div class="campo"><label for="e-obs">Observação</label><input type="text" id="e-obs" value="' + esc(ev.obs) + '"></div>' +
        '<div class="todo" style="display:flex;gap:10px;flex-wrap:wrap"><button class="bt bt-cheio" type="submit">Salvar</button><button class="bt" type="button" id="cancela-ev">Cancelar</button>' + (ev.id ? '<button class="mini-bt perigo" type="button" id="exclui-ev">Excluir</button>' : '') + '</div></form></div>'
        : '<p><button class="bt bt-cheio" id="novo-ev" type="button">Adicionar evento</button></p>') +
      '<div class="caixa">' + (evs.length ? evs.map(function (e) {
        var passou = (e.fim || e.inicio) < h;
        var grupos = YJ.reservas().filter(function (r) { return r.evento === e.nome && r.status !== 'cancelada'; }).length;
        return '<div class="linha-adm"' + (passou ? ' style="opacity:.6"' : '') + '><div><div class="t">' + YJ.periodo(e) + ' · ' + esc(e.nome) + (passou ? ' (já passou)' : '') + '</div><div class="s">' + esc(e.publico || '') + (grupos ? ' · ' + grupos + ' reserva(s) de grupo' : '') + '</div></div>' +
          '<div class="acoes"><button class="mini-bt" data-ev="' + e.id + '">Editar</button></div></div>';
      }).join('') : '<p>Nenhum evento cadastrado.</p>') + '</div>';
    var n = $('#novo-ev'); if (n) n.addEventListener('click', function () { estado.editEv = 'novo'; eventos(); });
    $$('[data-ev]').forEach(function (b) { b.addEventListener('click', function () { estado.editEv = b.getAttribute('data-ev'); eventos(); }); });
    var f = $('#f-ev');
    if (f) {
      $('#cancela-ev').addEventListener('click', function () { estado.editEv = null; eventos(); });
      var ex = $('#exclui-ev'); if (ex) ex.addEventListener('click', function () { if (!confirm('Excluir este evento da agenda?')) return; YJ.grava('eventos', YJ.eventos().filter(function (x) { return x.id !== ev.id; })); estado.editEv = null; eventos(); });
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var nome = $('#e-nome').value.trim(); if (!nome) { $('#e-nome').focus(); return; }
        var ini = $('#e-ini').value || h, fim = $('#e-fim').value || ini; if (fim < ini) fim = ini;
        var novo = Object.assign({}, ev, { nome: nome, inicio: ini, fim: fim, publico: $('#e-pub').value.trim(), obs: $('#e-obs').value.trim() });
        var l = YJ.eventos();
        if (!novo.id) { novo.id = YJ.novoId(); l.push(novo); } else l = l.map(function (x) { return x.id === novo.id ? novo : x; });
        YJ.grava('eventos', l); estado.editEv = null; eventos();
      });
    }
  }

  /* ---------- ajustes ---------- */
  function ajustes() {
    var C = YJ.CASA;
    corpo.innerHTML = '<h2>Ajustes</h2><div class="caixa"><h3>Dados da casa</h3>' +
      '<p><b>WhatsApp de reservas:</b> ' + C.whatsappTxt + '<br><b>Horário:</b> ' + C.horario.txt + '<br><b>Onde:</b> ' + (C.endereco || '<i>endereço a confirmar</i>') + ' · ' + C.bairro + '<br><b>Instagram:</b> @' + C.instagram + '</p>' +
      '<p class="aviso">Para mudar estes dados, peça à Zync (ficam no arquivo assets/dados.js).</p></div>' +
      '<div class="caixa"><h3>Modo demonstração</h3><p>Tudo o que é salvo aqui fica só neste aparelho. Na versão final, reservas, cardápio e agenda ficam num banco na nuvem e o painel funciona em qualquer celular da equipe.</p>' +
      '<button class="mini-bt perigo" id="reset" type="button">Voltar aos dados de exemplo</button></div>';
    $('#reset').addEventListener('click', function () { if (confirm('Apagar o que foi feito e voltar aos exemplos?')) { YJ.semear(true); aba('reservas'); } });
  }
})();
