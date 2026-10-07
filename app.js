/* Logica: quiz do aluno, cronometro, codigo de resultado, painel do professor, ranking e modo TV. */
(function () {
  var reduce =
    window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s) {
    return document.querySelector(s);
  }
  var LET = ["A", "B", "C", "D", "E"];
  var SOUND_KEY = "osi6-som-v1",
    soundEnabled = localStorage.getItem(SOUND_KEY) !== "off",
    audioContext = null;
  function updateSoundButtons() {
    var button = $("#snd");
    if (button) {
      button.textContent = "Som: " + (soundEnabled ? "ligado" : "desligado");
      button.setAttribute("aria-pressed", String(soundEnabled));
    }
    button = $("#tv-snd");
    if (button) {
      button.textContent = soundEnabled ? "🔊" : "🔇";
      button.setAttribute("aria-pressed", String(soundEnabled));
    }
  }
  function playSound(kind) {
    if (!soundEnabled) return;
    var AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      if (!audioContext) audioContext = new AudioContextClass();
      var notes =
        kind === "correct"
          ? [660, 830, 990]
          : kind === "wrong"
            ? [220, 175]
            : kind === "join"
              ? [523, 659, 784]
              : kind === "up"
                ? [440, 660, 880]
                : kind === "down"
                  ? [660, 440]
                  : [880, 1100, 1320];
      function playNotes() {
        if (!audioContext || audioContext.state !== "running") return;
        var now = audioContext.currentTime + 0.02;
        notes.forEach(function (freq, i) {
          var osc = audioContext.createOscillator(),
            gain = audioContext.createGain(),
            start = now + i * 0.11;
          osc.type = kind === "wrong" ? "triangle" : "sine";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.start(start);
          osc.stop(start + 0.21);
        });
      }
      if (audioContext.state === "suspended") {
        audioContext
          .resume()
          .then(playNotes)
          .catch(function () {});
      } else {
        playNotes();
      }
    } catch (e) {}
  }
  function unlockAudio() {
    var AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      if (!audioContext) audioContext = new AudioContextClass();
      if (audioContext.state === "suspended")
        audioContext.resume().catch(function () {});
    } catch (e) {}
  }
  updateSoundButtons();

  /* ---------- utilidades ---------- */
  function fmt(t) {
    if (typeof t !== "number" || !isFinite(t)) return "–";
    var m = Math.floor(t / 60),
      s = t % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }
  function encode(name, answers, secs) {
    var json = JSON.stringify({ n: name, a: answers, t: secs });
    return (
      "OSI6B-" +
      btoa(unescape(encodeURIComponent(json)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "")
    );
  }
  function decode(code) {
    try {
      var b = code.slice(6).replace(/-/g, "+").replace(/_/g, "/");
      while (b.length % 4) b += "=";
      var j = JSON.parse(decodeURIComponent(escape(atob(b))));
      if (
        j &&
        typeof j.n === "string" &&
        j.n.trim() &&
        Array.isArray(j.a) &&
        j.a.length === N &&
        j.a.every(function (x) {
          return x === 0 || x === 1 || x === 2 || x === 3 || x === 4;
        })
      ) {
        var t =
          typeof j.t === "number" && j.t >= 0 && j.t < 86400
            ? Math.round(j.t)
            : null;
        return { n: j.n.trim().slice(0, 40), a: j.a, t: t };
      }
    } catch (e) {}
    return null;
  }
  function copyText(text, okMsg, onFail) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          okMsg && okMsg();
        },
        function () {
          onFail && onFail();
        },
      );
    } else {
      onFail && onFail();
    }
  }

  /* ---------- abas e modo TV ---------- */
  var professorAuthorized = false;
  var PROFESSOR_ID = "55786123";
  function setTv(on) {
    document.body.classList.toggle("tv", on);
    if (on && document.documentElement.requestFullscreen)
      document.documentElement.requestFullscreen().catch(function () {});
    if (!on && document.fullscreenElement && document.exitFullscreen)
      document.exitFullscreen().catch(function () {});
  }
  function show(which) {
    var prof = which === "prof";
    if (!prof) setTv(false);
    $("#aluno").hidden = prof;
    $("#prof").hidden = !prof;
    $("#tab-aluno").setAttribute("aria-pressed", String(!prof));
    $("#tab-prof").setAttribute("aria-pressed", String(prof));
    if (prof && professorAuthorized) renderProf();
  }
  $("#tab-aluno").addEventListener("click", function () {
    show("aluno");
  });
  $("#tab-prof").addEventListener("click", function () {
    show("prof");
    if (!professorAuthorized) $("#teacher-id").focus();
  });
  $("#teacher-id-toggle").addEventListener("click", function () {
    var input = $("#teacher-id"),
      visible = input.type === "password";
    input.type = visible ? "text" : "password";
    this.setAttribute("aria-pressed", String(visible));
    this.setAttribute("aria-label", visible ? "Ocultar ID" : "Mostrar ID");
    this.title = visible ? "Ocultar ID" : "Mostrar ID";
    input.focus();
  });
  $("#teacher-login").addEventListener("submit", function (e) {
    e.preventDefault();
    if ($("#teacher-id").value.trim() !== PROFESSOR_ID) {
      $("#teacher-status").textContent = "ID incorreto. Verifique e tente novamente.";
      $("#teacher-id").select();
      return;
    }
    professorAuthorized = true;
    $("#teacher-access").hidden = true;
    $("#teacher-content").hidden = false;
    $("#teacher-status").textContent = "";
    $("#teacher-id").value = "";
    renderProf();
  });
  $("#p-tv").addEventListener("click", function () {
    var tvUrl = new URL(location.href);
    tvUrl.searchParams.set("tv", "1");
    window.open(tvUrl.href, "_blank", "noopener");
  });
  if ($("#tv-exit"))
    $("#tv-exit").addEventListener("click", function () {
      window.close();
    });
  $("#snd").addEventListener("click", function () {
    soundEnabled = !soundEnabled;
    localStorage.setItem(SOUND_KEY, soundEnabled ? "on" : "off");
    updateSoundButtons();
    if (soundEnabled) playSound("toggle");
  });
  if ($("#tv-snd"))
    $("#tv-snd").addEventListener("click", function (e) {
      e.stopPropagation();
      soundEnabled = !soundEnabled;
      localStorage.setItem(SOUND_KEY, soundEnabled ? "on" : "off");
      updateSoundButtons();
      if (soundEnabled) playSound("toggle");
    });

  /* ---------- aluno ---------- */
  var card = $("#quiz-card"),
    studentName = "",
    qi = 0,
    answers = [],
    score = 0,
    t0 = 0,
    tEnd = 0,
    timerId = 0,
    order = [];
  /* embaralha so a ORDEM das perguntas (Fisher-Yates). As alternativas nunca sao embaralhadas. */
  function shuffled(n) {
    var a = [],
      i,
      j,
      t;
    for (i = 0; i < n; i++) a.push(i);
    for (i = n - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }
  function badge(d) {
    return '<span class="lvl l' + d + '">' + LEVELS[d] + "</span>";
  }
  function tick() {
    var el = $("#clock");
    if (el) el.textContent = fmt(Math.floor((Date.now() - t0) / 1000));
  }
  function renderStart() {
    clearInterval(timerId);
    card.classList.add("start-card");
    card.innerHTML =
      '<h2>Antes de começar</h2>' +
      '<div class="info"><span>' +
      N +
      " perguntas</span><span>cerca de 5 minutos</span><span>o tempo conta para o ranking</span></div>" +
      '<div class="start-form"><label class="lbl" for="nome">Seu nome</label>' +
      '<input class="field" id="nome" type="text" maxlength="40" autocomplete="name">' +
      '<p class="hint">Use o nome que o professor conhece. Ele aparece no ranking.</p>' +
      '<p class="status" id="nome-err" aria-live="polite"></p>' +
      '<div class="row start-actions"><button class="btn primary start-button" id="go" type="button">Começar o quiz</button></div></div>';
    $("#nome").value = studentName;
    function go() {
      var v = $("#nome").value.replace(/\s+/g, " ").trim();
      if (v.length < 2) {
        $("#nome-err").textContent = "Digite pelo menos 2 letras.";
        return;
      }
      studentName = v;
      qi = 0;
      answers = new Array(N);
      score = 0;
      order = shuffled(N);
      t0 = Date.now();
      clearInterval(timerId);
      timerId = setInterval(tick, 1000);
      renderQ();
    }
    $("#go").addEventListener("click", go);
    $("#nome").addEventListener("keydown", function (e) {
      if (e.key === "Enter") go();
    });
  }
  function renderQ() {
    card.classList.remove("start-card");
    var q = QUIZ[order[qi]];
    card.innerHTML =
      '<div class="q-meta"><span class="q-num">Pergunta ' +
      (qi + 1) +
      " de " +
      N +
      badge(q.d) +
      '</span><span class="clock" id="clock">00:00</span><span>Acertos: ' +
      score +
      "</span></div>" +
      '<div class="bar"><i style="width:' +
      (qi / N) * 100 +
      '%"></i></div>' +
      '<p class="q-text" id="q-text">' +
      q.q +
      "</p>" +
      '<div class="opts" role="group" aria-labelledby="q-text">' +
      q.o
        .map(function (t, i) {
          return (
            '<button type="button" class="opt" data-i="' +
            i +
            '"><span class="l">' +
            LET[i] +
            "</span><span>" +
            t +
            "</span></button>"
          );
        })
        .join("") +
      "</div>" +
      '<div id="fb" aria-live="polite"></div>';
    tick();
    var btns = card.querySelectorAll(".opt");
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener("click", function () {
        answer(+b.dataset.i, btns);
      });
    });
  }
  function answer(pick, btns) {
    var q = QUIZ[order[qi]],
      ok = pick === q.c,
      last = qi === N - 1;
    answers[order[qi]] = pick;
    if (ok) score++;
    playSound(ok ? "correct" : "wrong");
    if (navigator.vibrate) navigator.vibrate(ok ? 35 : [35, 45, 70]);
    if (last) {
      tEnd = Date.now();
      clearInterval(timerId);
    }
    Array.prototype.forEach.call(btns, function (b, i) {
      b.disabled = true;
      if (i === q.c) b.classList.add("right");
      else if (i === pick) b.classList.add("wrong");
    });
    var html = ok
      ? '<p class="ttl ok">Correto</p>'
      : '<p class="ttl no">Não foi essa</p><p>Você marcou <b>' +
        LET[pick] +
        "</b>. A resposta certa é <b>" +
        LET[q.c] +
        ") " +
        q.o[q.c] +
        "</b>.</p>";
    html +=
      '<div class="fb-actions"><button type="button" class="btn primary" id="q-next">' +
      (last ? "Ver resultado" : "Próxima pergunta") +
      "</button></div>";
    var fb = $("#fb");
    fb.className = "fb";
    fb.innerHTML = html;
    $("#q-next").addEventListener("click", function () {
      qi++;
      if (qi >= N) renderResult();
      else renderQ();
    });
    $("#q-next").focus({ preventScroll: true });
  }
  function renderResult() {
    var pct = Math.round((score / N) * 100),
      secs = Math.max(0, Math.round((tEnd - t0) / 1000));
    var level =
      pct === 100
        ? "Camada 6 dominada"
        : pct >= 70
          ? "Quase lá"
          : pct >= 50
            ? "Boa base"
            : "Vale revisar";
    var code = encode(studentName, answers, secs);
    card.innerHTML =
      '<div class="result"><div class="score">' +
      score +
      "<small> / " +
      N +
      "</small></div>" +
      '<p class="level">' +
      level +
      " · " +
      pct +
      "% de acertos</p>" +
      '<p class="meta2">Tempo: ' +
      fmt(secs) +
      "</p>" +
      "<p>Agora envie o código abaixo ao professor. É ele que coloca você no ranking e mostra quais questões você acertou.</p>" +
      '<div class="codebox" id="code"></div>' +
      '<div class="row"><button class="btn primary" id="copy" type="button">Copiar código</button><button class="btn" id="again" type="button">Refazer o quiz</button></div>' +
      '<p class="status" id="copy-st" aria-live="polite"></p></div>';
    $("#code").textContent = code;
    $("#copy").addEventListener("click", function () {
      copyText(
        code,
        function () {
          $("#copy-st").textContent =
            "Código copiado. Cole na conversa com o professor.";
        },
        function () {
          var r = document.createRange();
          r.selectNodeContents($("#code"));
          var s = getSelection();
          s.removeAllRanges();
          s.addRange(r);
          $("#copy-st").textContent =
            "Não consegui copiar sozinho. O código está selecionado: use Copiar do seu celular.";
        },
      );
    });
    $("#again").addEventListener("click", function () {
      renderStart();
    });
  }
  renderStart();

  /* ---------- professor ---------- */
  var KEY = "osi6-resultados-v3";
  var results = {}; /* nome normalizado -> {n,a,t} */
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (saved && typeof saved === "object") results = saved;
  } catch (e) {}
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(results));
    } catch (e) {}
  }
  function norm(s) {
    return s.toLowerCase().replace(/\s+/g, " ").trim();
  }
  function hits(r) {
    return r.a.reduce(function (s, x, i) {
      return s + (x === QUIZ[i].c ? 1 : 0);
    }, 0);
  }
  function ranked() {
    return Object.keys(results)
      .map(function (k) {
        return { k: k, r: results[k] };
      })
      .sort(function (x, y) {
        var d = hits(y.r) - hits(x.r);
        if (d) return d;
        var tx = typeof x.r.t === "number" ? x.r.t : Infinity,
          ty = typeof y.r.t === "number" ? y.r.t : Infinity;
        if (tx !== ty) return tx < ty ? -1 : 1;
        return x.r.n.localeCompare(y.r.n, "pt-BR");
      });
  }

  $("#p-read").addEventListener("click", function () {
    var found = $("#codes").value.match(/OSI6B-[A-Za-z0-9_-]+/g) || [];
    var added = 0,
      updated = 0,
      bad = 0;
    found.forEach(function (c) {
      var d = decode(c);
      if (!d) {
        bad++;
        return;
      }
      var k = norm(d.n);
      if (results[k]) {
        if (JSON.stringify(results[k]) !== JSON.stringify(d)) updated++;
      } else added++;
      results[k] = d;
    });
    persist();
    $("#p-status").textContent = found.length
      ? added +
        " novo(s)" +
        (updated
          ? ", " + updated + " atualizado(s) (o aluno refez o quiz)"
          : "") +
        (bad ? ", " + bad + " código(s) inválido(s) ignorado(s)" : "") +
        "."
      : "Nenhum código encontrado no texto colado.";
    if (found.length) $("#codes").value = "";
    renderProf();
  });
  $("#p-del-all").addEventListener("click", function () {
    if (!Object.keys(results).length) {
      $("#p-status").textContent = "Ainda não há alunos para remover.";
      return;
    }
    if (!window.confirm("Remover todos os alunos e seus resultados?")) return;
    results = {};
    persist();
    $("#p-status").textContent = "Todos os alunos foram removidos.";
    renderProf();
  });
  $("#sel-all").addEventListener("change", function () {
    Array.prototype.forEach.call(
      $("#p-table").querySelectorAll(".row-select"),
      function (checkbox) {
        checkbox.checked = $("#sel-all").checked;
      },
    );
    $("#p-del-sel").disabled = !$("#sel-all").checked;
  });
  $("#p-del-sel").addEventListener("click", function () {
    var selected = $("#p-table").querySelectorAll(".row-select:checked");
    if (!selected.length) return;
    if (
      !window.confirm(
        "Remover os " + selected.length + " aluno(s) selecionado(s)?",
      )
    )
      return;
    Array.prototype.forEach.call(selected, function (checkbox) {
      delete results[checkbox.dataset.k];
    });
    persist();
    $("#p-status").textContent = selected.length + " aluno(s) removido(s).";
    $("#sel-all").checked = false;
    $("#p-del-sel").disabled = true;
    renderProf();
  });
  if ($("#p-clear"))
    $("#p-clear").addEventListener("click", function () {
      var b = $("#p-clear");
      if (b.dataset.armed !== "1") {
        b.dataset.armed = "1";
        b.textContent = "Clique de novo para apagar todos";
        setTimeout(function () {
          b.dataset.armed = "";
          b.textContent = "Limpar todos os alunos";
        }, 4000);
        return;
      }
      results = {};
      persist();
      b.dataset.armed = "";
      b.textContent = "Limpar todos os alunos";
      $("#p-status").textContent = "Todos os alunos foram removidos.";
      renderProf();
    });
  $("#p-copy").addEventListener("click", function () {
    var rows = ranked();
    if (!rows.length) {
      $("#p-status").textContent = "Ainda não há resultados para copiar.";
      return;
    }
    var head = ["Posição", "Nome", "Acertos", "Tempo"].concat(
      QUIZ.map(function (_, i) {
        return "Q" + (i + 1);
      }),
    );
    var lines = [head.join("\t")].concat(
      rows.map(function (o, i) {
        var r = o.r;
        return [i + 1, r.n, hits(r), fmt(r.t)]
          .concat(
            r.a.map(function (x, j) {
              return x === QUIZ[j].c ? 1 : 0;
            }),
          )
          .join("\t");
      }),
    );
    var tsv = lines.join("\n"),
      ta = $("#tsv");
    copyText(
      tsv,
      function () {
        ta.hidden = true;
        $("#p-status").textContent =
          "Tabela copiada. Cole no Google Planilhas ou no Excel.";
      },
      function () {
        ta.hidden = false;
        ta.value = tsv;
        ta.focus();
        ta.select();
        $("#p-status").textContent =
          "Não consegui copiar sozinho. A tabela está selecionada: copie e cole na planilha.";
      },
    );
  });
  $("#p-csv").addEventListener("click", function () {
    var rows = ranked();
    if (!rows.length) {
      $("#p-status").textContent = "Ainda não há resultados para exportar.";
      return;
    }
    var quote = function (value) {
      return '"' + String(value).replace(/"/g, '""') + '"';
    };
    var header = ["Posição", "Nome", "Acertos", "Tempo"].concat(
      QUIZ.map(function (_, i) {
        return "Q" + (i + 1);
      }),
    );
    var csv = [header.map(quote).join(";")]
      .concat(
        rows.map(function (item, i) {
          return [i + 1, item.r.n, hits(item.r), fmt(item.r.t)]
            .concat(
              item.r.a.map(function (answer, j) {
                return answer === QUIZ[j].c ? 1 : 0;
              }),
            )
            .map(quote)
            .join(";");
        }),
      )
      .join("\r\n");
    var url = URL.createObjectURL(
      new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }),
    );
    var link = document.createElement("a");
    link.href = url;
    link.download = "ranking-camada-6.csv";
    link.click();
    URL.revokeObjectURL(url);
    $("#p-status").textContent = "Arquivo CSV exportado.";
  });
  $("#p-table").addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".x");
    if (!b) return;
    if (b.dataset.armed !== "1") {
      b.dataset.armed = "1";
      b.textContent = "Remover?";
      setTimeout(function () {
        if (b.isConnected) {
          b.dataset.armed = "";
          b.textContent = "✕";
        }
      }, 3000);
      return;
    }
    var who = results[b.dataset.k];
    delete results[b.dataset.k];
    persist();
    $("#p-status").textContent = (who ? who.n : "Aluno") + " foi removido.";
    renderProf();
  });

  function renderProf() {
    var rows = ranked(),
      has = rows.length > 0;
    $("#p-podcard").hidden = !has;
    $("#p-qcard").hidden = !has;
    if (!has) return;
    var total = rows.reduce(function (s, o) {
      return s + hits(o.r);
    }, 0);
    var timed = rows.filter(function (o) {
      return typeof o.r.t === "number";
    });
    var avgT = timed.length
      ? Math.round(
          timed.reduce(function (s, o) {
            return s + o.r.t;
          }, 0) / timed.length,
        )
      : null;
    $("#p-summary").textContent =
      rows.length +
      " aluno(s) · média de " +
      (total / rows.length).toFixed(1).replace(".", ",") +
      " acertos em " +
      N +
      (avgT !== null ? " · tempo médio " + fmt(avgT) : "") +
      ".";

    /* pódio: 2º, 1º, 3º */
    var pod = $("#podium");
    pod.innerHTML = "";
    [1, 0, 2].forEach(function (i) {
      if (!rows[i]) return;
      var o = rows[i],
        d = document.createElement("div");
      d.className = "pod p" + (i + 1);
      d.innerHTML =
        '<div class="who"></div><div class="meta"></div><div class="step"></div>';
      d.querySelector(".who").textContent = o.r.n;
      d.querySelector(".meta").textContent =
        hits(o.r) + "/" + N + " · " + fmt(o.r.t);
      d.querySelector(".step").textContent = i + 1 + "º";
      pod.appendChild(d);
    });

    /* tabela */
    var h =
      '<thead><tr><th><input type="checkbox" id="select-visible" aria-label="Selecionar todos os alunos visíveis"></th><th>Aluno</th><th>Nota</th><th>Tempo</th>' +
      QUIZ.map(function (_, i) {
        return "<th>Q" + (i + 1) + "</th>";
      }).join("") +
      '<th class="rm"></th></tr></thead><tbody>';
    rows.forEach(function (o, i) {
      var r = o.r;
      h +=
        '<tr><td><input type="checkbox" class="row-select" aria-label="Selecionar aluno"></td><td><span class="pos r' +
        (i < 3 ? i + 1 : 0) +
        '">' +
        (i + 1) +
        'º</span><span class="nm"></span></td><td class="sc">' +
        hits(r) +
        "/" +
        N +
        '</td><td class="tm">' +
        fmt(r.t) +
        "</td>" +
        r.a
          .map(function (x, j) {
            return x === QUIZ[j].c
              ? '<td class="ok" aria-label="Acertou">✓</td>'
              : '<td class="no" aria-label="Errou, marcou ' +
                  LET[x] +
                  '">✗<small>' +
                  LET[x] +
                  "</small></td>";
          })
          .join("") +
        '<td class="rm"><button type="button" class="x" aria-label="Remover aluno">✕</button></td></tr>';
    });
    h += "</tbody>";
    var t = $("#p-table");
    t.innerHTML = h;
    var trs = t.querySelectorAll("tbody tr");
    rows.forEach(function (o, i) {
      trs[i].querySelector(".nm").textContent = o.r.n;
      trs[i].querySelector(".x").dataset.k = o.k;
      trs[i].querySelector(".row-select").dataset.k = o.k;
    });
    t.querySelector("#select-visible").addEventListener(
      "change",
      function (event) {
        Array.prototype.forEach.call(
          t.querySelectorAll(".row-select"),
          function (checkbox) {
            checkbox.checked = event.target.checked;
          },
        );
        $("#sel-all").checked = event.target.checked;
        $("#p-del-sel").disabled = !event.target.checked;
      },
    );
    Array.prototype.forEach.call(
      t.querySelectorAll(".row-select"),
      function (checkbox) {
        checkbox.addEventListener("change", function () {
          var all = t.querySelectorAll(".row-select");
          var selected = t.querySelectorAll(".row-select:checked");
          $("#sel-all").checked =
            all.length > 0 && all.length === selected.length;
          t.querySelector("#select-visible").checked = $("#sel-all").checked;
          $("#p-del-sel").disabled = selected.length === 0;
        });
      },
    );

    /* acertos por questão */
    var ql = $("#p-qlist");
    ql.innerHTML = "";
    QUIZ.forEach(function (q, i) {
      var c = rows.filter(function (o) {
          return o.r.a[i] === q.c;
        }).length,
        p = Math.round((c / rows.length) * 100);
      var li = document.createElement("li");
      li.innerHTML =
        '<span class="n">Q' +
        (i + 1) +
        '</span><span class="t"><span class="tt"></span><span class="b"><i class="' +
        (p < 50 ? "low" : "") +
        '" style="width:' +
        p +
        '%"></i></span></span><span class="p">' +
        p +
        "%</span>";
      li.querySelector(".tt").textContent =
        q.short + " · " + LEVELS[q.d] + " · " + c + " de " + rows.length;
      ql.appendChild(li);
    });
  }
  if (location.hash === "#professor") show("prof");

  /* ---------- modo TV: leitura compartilhada e animacoes de ranking ---------- */
  var tvMode = new URLSearchParams(location.search).get("tv") === "1";
  function tvHits(result) {
    return result.a.reduce(function (sum, answer, i) {
      return sum + (answer === QUIZ[i].c ? 1 : 0);
    }, 0);
  }
  function readTvResults() {
    try {
      var value = JSON.parse(localStorage.getItem(KEY) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch (e) {
      return {};
    }
  }
  function tvRanked(data) {
    return Object.keys(data)
      .map(function (k) {
        return { k: k, r: data[k] };
      })
      .filter(function (item) {
        return item.r && Array.isArray(item.r.a) && item.r.a.length === N;
      })
      .sort(function (a, b) {
        var delta = tvHits(b.r) - tvHits(a.r);
        if (delta) return delta;
        var ta = typeof a.r.t === "number" ? a.r.t : Infinity,
          tb = typeof b.r.t === "number" ? b.r.t : Infinity;
        if (ta !== tb) return ta < tb ? -1 : 1;
        return a.r.n.localeCompare(b.r.n, "pt-BR");
      });
  }
  function initTv() {
    document.body.classList.add("tv-mode");
    $("#top").hidden = true;
    $("#tv").hidden = false;
    var previous = {},
      lastSnapshot = "",
      alertTimer = 0;
    try {
      previous =
        JSON.parse(sessionStorage.getItem("osi6-tv-ranks") || "{}") || {};
    } catch (e) {}
    function render() {
      var data = readTvResults(),
        snapshot = JSON.stringify(data);
      if (snapshot === lastSnapshot) return;
      var rows = tvRanked(data),
        positions = {},
        entrants = [],
        up = [],
        down = [],
        podiumChanges = [];
      rows.forEach(function (item, index) {
        var rank = index + 1,
          old = previous[item.k];
        positions[item.k] = rank;
        if (old === undefined) {
          if (lastSnapshot) entrants.push(item.r.n);
        } else if (old !== rank) {
          (rank < old ? up : down).push(item.r.n);
          if (rank <= 3 && old > 3)
            podiumChanges.push(item.r.n + " entrou no pódio");
          else if (rank > 3 && old <= 3)
            podiumChanges.push(item.r.n + " saiu do pódio");
          else if (rank <= 3 && old <= 3)
            podiumChanges.push(
              item.r.n +
                (rank < old ? " subiu" : " desceu") +
                " para " +
                rank +
                "º lugar",
            );
        }
      });
      $("#tv-count").textContent =
        rows.length + " participante" + (rows.length === 1 ? "" : "s");
      $("#tv-empty").hidden = rows.length > 0;
      var podium = $("#tv-pod"),
        list = $("#tv-list");
      podium.dataset.count = String(Math.min(rows.length, 3));
      podium.innerHTML = "";
      list.innerHTML = "";
      [1, 0, 2].forEach(function (index) {
        var item = rows[index];
        if (!item) return;
        var rank = index + 1,
          old = previous[item.k],
          node = document.createElement("article");
        node.className = "tv-place place-" + rank;
        if (old === undefined && lastSnapshot) node.classList.add("tv-enter");
        else if (old !== undefined && old !== rank)
          node.classList.add(rank < old ? "tv-rise" : "tv-fall");
        node.innerHTML =
          '<span class="tv-medal"></span><strong class="tv-name"></strong><span class="tv-score"></span><span class="tv-move" aria-live="polite"></span>';
        node.querySelector(".tv-medal").textContent = rank + "º";
        node.querySelector(".tv-name").textContent = item.r.n;
        node.querySelector(".tv-score").textContent =
          tvHits(item.r) + " / " + N + " acertos · " + fmt(item.r.t);
        if (old !== undefined && old !== rank)
          node.querySelector(".tv-move").textContent =
            rank < old ? "▲ " + (old - rank) : "▼ " + (rank - old);
        podium.appendChild(node);
      });
      rows.forEach(function (item, index) {
        var rank = index + 1,
          old = previous[item.k],
          li = document.createElement("li");
        li.className = "tv-row";
        if (old === undefined && lastSnapshot) li.classList.add("tv-enter");
        else if (old !== undefined && old !== rank)
          li.classList.add(rank < old ? "tv-rise" : "tv-fall");
        var move =
          old === undefined || old === rank
            ? ""
            : rank < old
              ? "▲ " + (old - rank)
              : "▼ " + (rank - old);
        li.innerHTML =
          '<span class="tv-position"></span><span class="tv-row-name"></span><span class="tv-row-score"></span><span class="tv-row-move"></span>';
        li.querySelector(".tv-position").textContent = rank + "º";
        li.querySelector(".tv-row-name").textContent = item.r.n;
        li.querySelector(".tv-row-score").textContent =
          tvHits(item.r) + "/" + N + " · " + fmt(item.r.t);
        li.querySelector(".tv-row-move").textContent = move;
        list.appendChild(li);
      });
      var messages = [];
      if (entrants.length) {
        messages.push(
          entrants.join(", ") +
            " entrou" +
            (entrants.length === 1 ? "" : "/entraram") +
            " no ranking.",
        );
        playSound("join");
      }
      if (podiumChanges.length) {
        messages = messages.concat(
          podiumChanges.map(function (message) {
            return message + ".";
          }),
        );
        playSound(
          podiumChanges.some(function (text) {
            return text.indexOf("saiu") >= 0 || text.indexOf("desceu") >= 0;
          })
            ? "down"
            : "up",
        );
      }
      if (messages.length) {
        $("#tv-alert").textContent = messages.join(" ");
        window.clearTimeout(alertTimer);
        alertTimer = window.setTimeout(function () {
          $("#tv-alert").textContent = "";
        }, 6000);
      }
      previous = positions;
      lastSnapshot = snapshot;
      try {
        sessionStorage.setItem("osi6-tv-ranks", JSON.stringify(previous));
      } catch (e) {}
    }
    render();
    window.addEventListener("storage", function (e) {
      if (e.key === KEY) render();
    });
    window.setInterval(render, 1200);
    document.addEventListener(
      "pointerdown",
      function () {
        unlockAudio();
        if (
          document.documentElement.requestFullscreen &&
          !document.fullscreenElement
        )
          document.documentElement.requestFullscreen().catch(function () {});
      },
      { once: true, capture: true },
    );
    document.addEventListener("keydown", function (e) {
      if (e.key.toLowerCase() === "m") $("#tv-snd").click();
      if (
        e.key.toLowerCase() === "f" &&
        document.documentElement.requestFullscreen
      )
        document.documentElement.requestFullscreen().catch(function () {});
    });
  }
  if (tvMode) initTv();

  document.addEventListener("keydown", function (e) {
    if (tvMode || $("#aluno").hidden || e.ctrlKey || e.metaKey || e.altKey)
      return;
    if (e.target.matches('input,textarea,select,[contenteditable="true"]'))
      return;
    var index = /^[1-5]$/.test(e.key)
      ? Number(e.key) - 1
      : LET.indexOf(e.key.toUpperCase());
    if (index < 0) return;
    var option = $('.opt:not(:disabled)[data-i="' + index + '"]');
    if (option) option.click();
  });

  /* ---------- fundo: rede animada ---------- */
  (function () {
    var c = $("#net"),
      ctx = c.getContext("2d");
    if (!ctx) return;
    var w = 0,
      h = 0,
      nodes = [],
      raf = 0,
      lastW = 0;
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      lastW = w;
      c.width = w * dpr;
      c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(70, Math.max(24, (w * h) / 22000)));
      nodes = [];
      for (var i = 0; i < n; i++)
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 1.2 + Math.random() * 1.7,
        });
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      var D = 170,
        now = performance.now(),
        pulseSpeed = reduce ? 0.00007 : 0.00017,
        edge = 0,
        i,
        j,
        a,
        b,
        d;
      ctx.lineWidth = 1;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < D) {
            ctx.lineWidth = 1;
            ctx.strokeStyle =
              "rgba(72,226,255," + (0.25 * (1 - d / D)).toFixed(3) + ")";
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            if (edge % 3 === 0) {
              var phase = (now * pulseSpeed + edge * 0.173) % 1,
                endPhase = Math.min(1, phase + 0.12),
                px = a.x + (b.x - a.x) * phase,
                py = a.y + (b.y - a.y) * phase,
                endX = a.x + (b.x - a.x) * endPhase,
                endY = a.y + (b.y - a.y) * endPhase;
              ctx.lineWidth = 2;
              ctx.strokeStyle = "rgba(130,245,255,.82)";
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(endX, endY);
              ctx.stroke();
              ctx.beginPath();
              ctx.fillStyle = "rgba(210,252,255,.98)";
              ctx.arc(endX, endY, 2, 0, 6.2832);
              ctx.fill();
            }
            edge++;
          }
        }
      }
      ctx.fillStyle = "rgba(104,240,209,.72)";
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, 6.2832);
        ctx.fill();
      }
    }
    function loop() {
      draw();
      raf = requestAnimationFrame(loop);
    }
    size();
    draw();
    loop();
    document.addEventListener("visibilitychange", function () {
      cancelAnimationFrame(raf);
      if (!document.hidden) loop();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth !== lastW) {
        size();
        draw();
      }
    });
  })();
})();
