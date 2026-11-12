/* Restaurante Yemanjá — comportamento do site (topo, rodapé, reserva, cardápio, agenda, rolagem). */
(function () {
  'use strict';
  var C = YJ.CASA, esc = YJ.esc;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var pagina = document.body.getAttribute('data-pagina') || '';

  // linha de onda em SVG (n cristas)
  function onda(n, alt) {
    n = n || 12; alt = alt || 10;
    var w = 1200, passo = w / n, d = 'M0 ' + (alt + 2);
    for (var i = 0; i < n; i++) { var x = i * passo; d += ' Q' + (x + passo / 4) + ' 2 ' + (x + passo / 2) + ' ' + (alt + 2) + ' T' + (x + passo) + ' ' + (alt + 2); }
    return '<svg class="onda" viewBox="0 0 1200 ' + (alt * 2 + 4) + '" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + '"/></svg>';
  }
  window.YJ.onda = onda;
  var MARCA_SVG = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M4 26c6-10 12-10 16 0s10 10 16 0" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M8 16c4-6 8-6 12 0s8 6 12 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity=".55"/></svg>';
  var PEIXE_SVG = '<svg viewBox="0 0 60 30" aria-hidden="true"><path d="M4 15c10-12 30-12 40 0-10 12-30 12-40 0zm40 0 12-9v18z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><circle cx="14" cy="13" r="2" fill="currentColor"/></svg>';

  /* ---------------- topo + status ---------------- */
  function topo() {
    var el = $('#topo'); if (!el) return;
    var a = YJ.aberto();
    var links = [['index.html#historia', 'História', 'inicio'], ['cardapio.html', 'Cardápio', 'cardapio'], ['convencoes.html', 'Centro de Convenções', 'convencoes'], ['visitantes.html', 'English · Español', 'visitantes']];
    el.innerHTML =
      '<a class="pular" href="#conteudo">Pular para o conteúdo</a>' +
      '<div class="status"><div class="embrulho"><span class="' + (a.aberto ? '' : 'fechado') + '"><span class="ponto"></span>' + a.txt + '</span>' +
      '<span>Reservas: <a href="' + YJ.linkWa('Olá! Gostaria de fazer uma reserva no Yemanjá.') + '" target="_blank" rel="noopener">' + C.whatsappTxt + '</a></span></div></div>' +
      '<header class="topo"><div class="embrulho" style="position:relative">' +
      '<a class="marca" href="index.html" aria-label="Restaurante Yemanjá, início">' + MARCA_SVG + '<b>Yemanjá</b></a>' +
      '<button class="abre-menu" aria-expanded="false" aria-controls="menu">Menu</button>' +
      '<nav class="menu" id="menu" aria-label="Principal">' +
      links.map(function (l) { return '<a href="' + l[0] + '"' + (pagina === l[2] ? ' aria-current="page"' : '') + '>' + l[1] + '</a>'; }).join('') +
      '<a class="bt bt-cheio" href="' + (pagina === 'convencoes' ? '#reservar' : 'index.html#reservar') + '">Reservar</a></nav></div></header>';
    var bt = $('.abre-menu', el), menu = $('#menu', el);
    bt.addEventListener('click', function () { var ab = menu.classList.toggle('aberto'); bt.setAttribute('aria-expanded', ab); bt.textContent = ab ? 'Fechar' : 'Menu'; });
    $$('a', menu).forEach(function (l) { l.addEventListener('click', function () { menu.classList.remove('aberto'); bt.setAttribute('aria-expanded', false); bt.textContent = 'Menu'; }); });
  }

  function rodape() {
    var el = $('#rodape'); if (!el) return;
    el.className = 'rodape';
    el.innerHTML = '<div class="embrulho">' +
      '<div><h3>Restaurante Yemanjá</h3><p>' + esc(C.slogan) + '.<br>' + esc(C.bio) + '</p><p>' + C.anos + ' anos servindo a Bahia à mesa.</p></div>' +
      '<div><h3>Horário</h3><p>Domingo a sábado<br>das 11h30 às 17h</p><p>Estacionamento na frente.</p></div>' +
      '<div><h3>Onde e reservas</h3><p>' + (C.endereco ? esc(C.endereco) + '<br>' : '') + esc(C.bairro) + '<br><a href="' + YJ.linkMapa() + '" target="_blank" rel="noopener">Abrir no mapa</a></p>' +
      '<p>WhatsApp <a href="' + YJ.linkWa('Olá! Gostaria de fazer uma reserva no Yemanjá.') + '" target="_blank" rel="noopener">' + C.whatsappTxt + '</a><br>Instagram <a href="https://instagram.com/' + C.instagram + '" target="_blank" rel="noopener">@' + C.instagram + '</a></p></div>' +
      '<p class="fim">Visiting Salvador? <a href="visitantes.html">English</a> · ¿De visita? <a href="visitantes.html?lang=es">Español</a> · <a href="admin.html">Painel do restaurante</a> · Demonstração feita pela Zync</p></div>';
  }

  /* ---------------- reserva ---------------- */
  function horarios() { var out = [], m = 11 * 60 + 30; while (m <= 16 * 60) { out.push(String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0')); m += 30; } return out; }

  function montarReserva(el, tipoInicial) {
    if (!el) return;
    var qs = new URLSearchParams(location.search);
    var tipo = qs.get('tipo') || tipoInicial || 'mesa';
    var evs = YJ.proximosEventos();
    el.innerHTML =
      '<form class="comanda" novalidate>' +
      '<fieldset><legend>Que tipo de reserva?</legend><div class="chips">' +
      YJ.TIPOS_RESERVA.map(function (t) { return '<label><input type="radio" name="tipo" value="' + t.id + '"' + (t.id === tipo ? ' checked' : '') + '><span>' + t.nome + '</span></label>'; }).join('') +
      '</div></fieldset>' +
      '<div class="campos">' +
      '<div class="campo"><label for="r-data">Dia</label><input type="date" id="r-data" name="data" min="' + YJ.hoje() + '" value="' + YJ.hoje() + '" required></div>' +
      '<div class="campo"><label for="r-hora">Horário</label><select id="r-hora" name="hora">' + horarios().map(function (h) { return '<option' + (h === '12:30' ? ' selected' : '') + '>' + h + '</option>'; }).join('') + '</select></div>' +
      '<div class="campo"><label for="r-pessoas">Pessoas</label><input type="number" id="r-pessoas" name="pessoas" min="1" max="200" value="2" inputmode="numeric" required></div>' +
      '<div class="campo"><label for="r-nome">Seu nome</label><input type="text" id="r-nome" name="nome" autocomplete="name" required></div>' +
      '<div class="campo todo" data-so="evento"><label for="r-evento">Qual evento?</label><select id="r-evento" name="evento"><option value="">Outro / não está na lista</option>' +
      evs.map(function (e) { return '<option>' + esc(e.nome) + '</option>'; }).join('') + '</select></div>' +
      '<div class="campo todo"><label for="r-obs">Algum pedido? <span class="aviso">(opcional)</span></label><textarea id="r-obs" name="obs" placeholder="Ex.: mesa perto da janela, cadeira de bebê, horário de saída do congresso"></textarea></div>' +
      '</div>' +
      '<button class="bt bt-cheio bt-largo" type="submit">Enviar pedido pelo WhatsApp</button>' +
      '<p class="aviso" style="margin:12px 0 0">A mensagem abre pronta no WhatsApp do restaurante. A reserva vale depois que a casa responder.</p>' +
      '<div class="saida" aria-live="polite"></div></form>';
    var f = $('form', el);
    function mostraEvento() { var t = f.tipo.value; $$('[data-so=evento]', f).forEach(function (c) { c.hidden = t !== 'evento'; }); if ((t === 'grupo' || t === 'evento') && +f.pessoas.value < 8) f.pessoas.value = 8; }
    $$('input[name=tipo]', f).forEach(function (r) { r.addEventListener('change', mostraEvento); });
    mostraEvento();
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = f.nome.value.trim(), saida = $('.saida', f);
      if (!nome) { saida.innerHTML = '<p class="erro">Escreva seu nome para a casa saber quem chega.</p>'; f.nome.focus(); return; }
      var r = { tipo: f.tipo.value, data: f.data.value || YJ.hoje(), hora: f.hora.value, pessoas: +f.pessoas.value || 1, nome: nome, tel: '', evento: f.tipo.value === 'evento' ? f.evento.value : '', idioma: 'pt', obs: f.obs.value.trim() };
      YJ.addReserva(r);
      var msg = 'Olá! Quero reservar no Yemanjá.\n\n*' + YJ.nomeTipo(r.tipo) + '*\nDia: ' + YJ.dataLonga(r.data) + '\nHorário: ' + r.hora + '\nPessoas: ' + r.pessoas + '\nNome: ' + r.nome +
        (r.evento ? '\nEvento: ' + r.evento + ' (Centro de Convenções)' : '') + (r.obs ? '\nObs.: ' + r.obs : '');
      var link = YJ.linkWa(msg);
      saida.innerHTML = '<div class="ok">Pedido anotado. Se o WhatsApp não abriu, <a href="' + link + '" target="_blank" rel="noopener">toque aqui para enviar</a>.</div>';
      window.open(link, '_blank', 'noopener');
    });
  }
  window.YJ.montarReserva = montarReserva;

  /* ---------------- agenda do Centro de Convenções ---------------- */
  function agenda(el, limite) {
    if (!el) return;
    var evs = YJ.proximosEventos();
    if (limite) evs = evs.slice(0, limite);
    el.innerHTML = evs.length ? evs.map(function (e) {
      return '<li><span class="quando">' + YJ.periodo(e) + '</span><span><span class="oque">' + esc(e.nome) + '</span>' + (e.publico ? '<span class="pub">' + esc(e.publico) + '</span>' : '') + (e.obs ? '<span class="pub">' + esc(e.obs) + '</span>' : '') + '</span></li>';
    }).join('') : '<li><span class="vazio">A agenda do mês sai no Instagram @' + C.instagram + '.</span></li>';
  }

  /* ---------------- pratos da home ---------------- */
  function pratosHome(el) {
    if (!el) return;
    var lista = YJ.cardapio().filter(function (i) { return i.destaque && i.foto; });
    el.innerHTML = lista.map(function (i, n) {
      return '<article class="prato-linha surge"><div class="arco"><img src="fotos/' + i.foto + '" alt="' + esc(i.nome) + ', foto do restaurante" loading="lazy"></div>' +
        '<div><span class="num">' + String(n + 1).padStart(2, '0') + '</span><h3>' + esc(i.nome) + (i.disponivel === false ? ' <span class="tag-hoje" style="font-size:14px">hoje não tem</span>' : '') + '</h3>' +
        (i.frase ? '<p class="frase">' + esc(i.frase) + '</p>' : '') + '<p>' + esc(i.desc) + '</p></div></article>';
    }).join('');
  }

  /* ---------------- cardápio ---------------- */
  function cardapio(el) {
    if (!el) return;
    var itens = YJ.cardapio();
    var nav = $('#abas-cat');
    if (nav) nav.innerHTML = YJ.CATEGORIAS.map(function (c) { return '<a href="#' + c.id + '">' + c.nome + '</a>'; }).join('');
    el.innerHTML = YJ.CATEGORIAS.map(function (c) {
      var lista = itens.filter(function (i) { return i.cat === c.id; });
      if (!lista.length) return '';
      return '<section class="cat" id="' + c.id + '"><header><h2>' + c.nome + '</h2><p>' + esc(c.nota) + '</p></header>' +
        lista.map(function (i) {
          var p = YJ.reais(i.preco);
          return '<article class="item surge' + (i.disponivel === false ? ' esgotado' : '') + '"><div class="mini-arco">' + (i.foto ? '<img src="fotos/' + i.foto + '" alt="" loading="lazy">' : PEIXE_SVG) + '</div>' +
            '<div><h3>' + esc(i.nome) + (i.disponivel === false ? '<span class="tag-hoje">hoje não tem</span>' : '') + '</h3>' + (i.frase ? '<p class="frase">' + esc(i.frase) + '</p>' : '') + '<p>' + esc(i.desc) + '</p></div>' +
            (p ? '<div class="preco">' + p + '</div>' : '<div class="preco consulte">preço no salão</div>') + '</article>';
        }).join('') + '</section>';
    }).join('');
  }

  /* ---------------- rolagem ---------------- */
  function rolagem() {
    var reduz = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('visto'); io.unobserve(e.target);
        if (e.target.hasAttribute('data-conta')) conta(e.target);
      });
    }, { threshold: .18 }) : null;
    $$('.surge, .mar-linha, [data-conta]').forEach(function (el) { if (io && !reduz) io.observe(el); else el.classList.add('visto'); });

    function conta(el) {
      var alvo = +el.getAttribute('data-conta'), alvoEl = el.firstChild, t0 = null;
      function passo(t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 1600); alvoEl.nodeValue = String(Math.round(alvo * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(passo); }
      if (!reduz) requestAnimationFrame(passo);
    }

    var desl = $$('[data-desliza]');
    if (!desl.length || reduz) return;
    var pend = false;
    function move() {
      pend = false;
      var vh = window.innerHeight;
      desl.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var prog = (vh - r.top) / (vh + r.height);           // 0 → 1 enquanto atravessa a tela
        var vel = parseFloat(el.getAttribute('data-desliza')) || 1;
        var larg = Math.max(0, el.scrollWidth - el.parentElement.clientWidth);
        var x = vel > 0 ? -prog * larg * Math.min(1, vel) : -(1 - prog) * larg * Math.min(1, -vel);
        el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      });
    }
    window.addEventListener('scroll', function () { if (!pend) { pend = true; requestAnimationFrame(move); } }, { passive: true });
    window.addEventListener('resize', move);
    move();
  }

  topo();
  rodape();
  pratosHome($('#lista-pratos'));
  cardapio($('#cardapio'));
  agenda($('#agenda-curta'), 3);
  agenda($('#agenda-toda'));
  $$('[data-onda]').forEach(function (el) { el.innerHTML = onda(+el.getAttribute('data-onda') || 12); });
  $$('.mar-linha').forEach(function (el) { el.insertAdjacentHTML('beforeend', onda(+el.getAttribute('data-cristas') || 9)); });
  montarReserva($('#form-reserva'), document.body.getAttribute('data-tipo-reserva'));
  rolagem();
})();
