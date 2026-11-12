/* Restaurante Yemanjá — comportamento do site (topo, rodapé, reserva, cardápio, agenda e as cenas de rolagem: maré, mesa posta, crachá). */
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

  /* ---------------- crista de onda cheia (a água das cenas) ---------------- */
  // n ondas num SVG com o dobro da largura: a crista anda meia largura e repete sem emenda.
  function crista(n) {
    var w = 2880, alt = 70, passo = w / n, base = 40, d = 'M0 ' + base;
    for (var i = 0; i < n; i++) { var x = i * passo; d += ' Q' + (x + passo / 4) + ' ' + (base - 26) + ' ' + (x + passo / 2) + ' ' + base + ' T' + (x + passo) + ' ' + base; }
    d += ' L' + w + ' ' + alt + ' L0 ' + alt + ' Z';
    return '<svg viewBox="0 0 ' + w + ' ' + alt + '" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + '"/></svg>';
  }

  /* ---------------- mesa posta (pratos da home) ---------------- */
  // posições na toalha (centro do prato em %), uma lista para tela larga e outra para celular
  var LUGARES = {
    largo: [[24, 30], [55, 22], [84, 36], [40, 70], [72, 74], [12, 72]],
    estreito: [[28, 22], [74, 18], [52, 50], [24, 80], [76, 80], [50, 14]]
  };
  var GIROS = [-14, 9, -6, 12, -10, 7];
  function mesa() {
    var el = $('#mesa-pratos'); if (!el) return [];
    var lista = YJ.cardapio().filter(function (i) { return i.destaque && i.foto; }).slice(0, 6);
    el.innerHTML = lista.map(function (i, n) {
      return '<figure class="pp" data-n="' + n + '"><span class="pp-guard" aria-hidden="true"></span><span class="pp-prato"><img src="fotos/' + i.foto + '" alt="' + esc(i.nome) + ', foto do restaurante"' + (n > 1 ? ' loading="lazy"' : '') + '></span>' +
        '<figcaption class="pp-nome">' + esc(i.nome) + '</figcaption></figure>';
    }).join('');
    var ul = $('#mesa-lista');
    if (ul) ul.innerHTML = lista.map(function (i) {
      return '<li><b>' + esc(i.nome) + (i.disponivel === false ? ' <span class="tag-hoje">hoje não tem</span>' : '') + '</b>' + (i.frase ? '<span class="frase">' + esc(i.frase) + '</span>' : '') + '<span>' + esc(i.desc) + '</span></li>';
    }).join('');
    function posiciona() {
      var tab = window.innerWidth < 861 ? LUGARES.estreito : LUGARES.largo;
      $$('.pp', el).forEach(function (f, n) { var l = tab[n % tab.length]; f.style.left = l[0] + '%'; f.style.top = l[1] + '%'; });
    }
    posiciona();
    window.addEventListener('resize', posiciona);
    return lista;
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
          return '<article class="item' + (i.disponivel === false ? ' esgotado' : '') + '"><div class="mini-arco">' + (i.foto ? '<img src="fotos/' + i.foto + '" alt="" loading="lazy">' : PEIXE_SVG) + '</div>' +
            '<div><h3>' + esc(i.nome) + (i.disponivel === false ? '<span class="tag-hoje">hoje não tem</span>' : '') + '</h3>' + (i.frase ? '<p class="frase">' + esc(i.frase) + '</p>' : '') + '<p>' + esc(i.desc) + '</p></div>' +
            (p ? '<div class="preco">' + p + '</div>' : '<div class="preco consulte">preço no salão</div>') + '</article>';
        }).join('') + '</section>';
    }).join('');
  }

  /* ---------------- cenas de rolagem (GSAP + ScrollTrigger) ---------------- */
  // Sem GSAP ou com prefers-reduced-motion: tira a classe "cena" e tudo fica parado, na versão estática.
  function cenas(pratos) {
    var raiz = document.documentElement;
    var reduz = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduz || !window.gsap || !window.ScrollTrigger) { raiz.classList.remove('cena'); return; }
    if (!raiz.classList.contains('cena')) raiz.classList.add('cena');
    gsap.registerPlugin(ScrollTrigger);
    var lim = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var sai = function (k) { return 1 - Math.pow(1 - k, 3); };

    /* A maré sobe: 0–68% da rolagem a água sobe e o número conta 0→52; 66–88% o salão aparece. */
    var mare = $('.mare');
    if (mare) {
      var nums = $$('.mare-num', mare), claro = $('.mare-claro', mare), frente = $('.agua-frente', mare), tras = $('.agua-tras', mare),
        salao = $('.mare-salao', mare), dica = $('.mare-dica', mare), ultimo = -1;
      var pinta = function (p) {
        var k = lim(p / 0.68), nivel = 104 - sai(k) * 108;          // topo da água em % da altura do palco
        var nTras = nivel - 6;
        frente.style.transform = 'translate3d(0,' + nivel.toFixed(2) + '%,0)';
        tras.style.transform = 'translate3d(0,' + nTras.toFixed(2) + '%,0)';
        claro.style.clipPath = 'inset(' + Math.max(0, nTras + 2).toFixed(2) + '% 0 0 0)';
        var n = Math.round(52 * sai(k));
        if (n !== ultimo) { ultimo = n; nums.forEach(function (e) { e.textContent = n; }); }
        var s = sai(lim((p - 0.66) / 0.22));
        salao.style.clipPath = 'inset(' + ((1 - s) * 100).toFixed(2) + '% 0 0 0)';
        salao.style.setProperty('--zoom', (1.12 - 0.12 * s).toFixed(3));
        salao.classList.toggle('chegou', s > 0.92);
        if (dica) dica.style.opacity = String(1 - lim(p / 0.08));
      };
      pinta(0);
      ScrollTrigger.create({ trigger: mare, start: 'top top', end: 'bottom bottom', onUpdate: function (st) { pinta(st.progress); }, onRefresh: function (st) { pinta(st.progress); } });
    }

    /* A mesa posta: cada prato desce na toalha numa fatia da rolagem; a legenda mostra o último colocado. */
    var mesaEl = $('.mesa');
    if (mesaEl && pratos && pratos.length) {
      var figs = $$('.pp', mesaEl), nomeEl = $('.mesa-nome', mesaEl), fraseEl = $('.mesa-frase', mesaEl), leg = $('.mesa-legenda', mesaEl),
        total = figs.length, atual = -2;
      var poe = function (p) {
        var vez = -1;
        figs.forEach(function (f, n) {
          var ini = n / total * 0.82, k = sai(lim((p - ini) / (0.82 / total * 0.75))), g = GIROS[n % GIROS.length];
          f.style.opacity = k.toFixed(3);
          f.style.transform = 'translate(-50%,-50%) translate3d(0,' + ((1 - k) * -70).toFixed(1) + 'px,0) scale(' + (1.35 - 0.35 * k).toFixed(3) + ') rotate(' + ((1 - k) * g * 2 + g * 0.15).toFixed(2) + 'deg)';
          f.classList.toggle('posto', k > 0.98);
          if (k > 0.6) vez = n;
        });
        if (vez !== atual) {
          atual = vez;
          leg.classList.remove('troca'); void leg.offsetWidth; leg.classList.add('troca');
          if (vez < 0) { nomeEl.textContent = 'Role a tela: a mesa vai sendo posta.'; fraseEl.textContent = ''; }
          else {
            var i = pratos[vez];
            nomeEl.textContent = i.nome + (i.disponivel === false ? ' · hoje não tem' : '');
            fraseEl.textContent = i.frase || i.desc;
          }
        }
      };
      poe(0);
      ScrollTrigger.create({ trigger: mesaEl, start: 'top top', end: 'bottom bottom', onUpdate: function (st) { poe(st.progress); }, onRefresh: function (st) { poe(st.progress); } });
    }

    /* Crachá de VISITANTE descendo pendurado no cordão. */
    var mm = gsap.matchMedia();
    $$('.pendurado').forEach(function (pend) {
      var modo = pend.getAttribute('data-desce');
      var altura = function () { return -Math.round(pend.offsetHeight * 0.85); };
      if (modo === 'rolagem') {
        // na home desce com a rolagem em qualquer tela (no celular o crachá vem antes do texto)
        gsap.set(pend, { rotation: -7 });
        var tl = gsap.timeline({ scrollTrigger: { trigger: pend.closest('section'), start: 'top 90%', end: 'top 5%', scrub: 0.6, invalidateOnRefresh: true } });
        tl.fromTo(pend, { y: altura }, { y: 0, ease: 'power2.out', duration: 1 }, 0)
          .to(pend, { keyframes: { rotation: [-7, 5, -2.5, 1, 0], easeEach: 'sine.inOut' }, ease: 'none', duration: 1 }, 0);
      } else {
        // na página do Centro de Convenções ele já está no alto: cai ao abrir, só em tela larga
        mm.add('(min-width: 861px)', function () {
          gsap.from(pend, { y: altura, duration: 1.1, ease: 'power3.out', delay: 0.2 });
          gsap.set(pend, { rotation: -8 });
          gsap.to(pend, { keyframes: { rotation: [-8, 6, -3, 1.2, 0], easeEach: 'sine.inOut' }, duration: 2.2, ease: 'none', delay: 0.2 });
        });
      }
    });

    raiz.classList.add('cena-ok');
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  topo();
  rodape();
  var pratos = mesa();
  cardapio($('#cardapio'));
  agenda($('#agenda-curta'), 3);
  agenda($('#agenda-toda'));
  $$('[data-onda]').forEach(function (el) { el.innerHTML = onda(+el.getAttribute('data-onda') || 12); });
  $$('[data-crista]').forEach(function (el) { el.innerHTML = crista(el.getAttribute('data-crista') === 'tras' ? 7 : 9); });
  montarReserva($('#form-reserva'), document.body.getAttribute('data-tipo-reserva'));
  cenas(pratos);
})();
