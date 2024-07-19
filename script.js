const dataUrl = 'https://script.google.com/macros/s/AKfycbx26iMUo0lNqtGC2ot3vD_K9TAAhZ_Y5t1UHij0vQP7Wm_iNr184xWEq5Uax_oat9sVTQ/exec';

let rotationAngle = 0;
let isRotating = false;
let startAngle = 0;
let initialRotation = 0;

d3.json(dataUrl).then(response => {
  const data = response.categories;
  const additionalInfo = response.additionalInfo;

  console.log('Loaded data:', data);
  console.log('Additional info:', additionalInfo);

  if (!data || data.length === 0) {
    console.error('No data loaded');
    d3.select("#chart").append("p").text("Ошибка: Данные не загружены");
    return;
  }

  const width = 720;
  const height = 720;
  const radius = Math.min(width, height) / 2 * 0.8;

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const chartGroup = svg.append("g")
    .attr("transform", `translate(${width / 2},${height / 2 + 30})`);

  const rotatingGroup = chartGroup.append("g");

  const rotationArea = chartGroup.append("circle")
    .attr("r", radius)
    .attr("fill", "transparent")
    .style("cursor", "grab");

  const outerRadius = radius * 0.95;
  const categoryInnerRadius = radius * 0.85;
  const categoryTextRadius = radius * 0.88;
  const typeOuterRadius = radius * 0.85;
  const typeInnerRadius = radius * 0.62;
  const separatorOuterRadius = radius * 0.62;
  const separatorInnerRadius = radius * 0.57;
  const scaleStartRadius = radius * 0.55;
  const centerRadius = radius * 0.15;

  const categoryArc = d3.arc()
    .innerRadius(categoryInnerRadius)
    .outerRadius(outerRadius);

  const typeArc = d3.arc()
    .innerRadius(typeInnerRadius)
    .outerRadius(typeOuterRadius);

  const separatorArc = d3.arc()
    .innerRadius(separatorInnerRadius)
    .outerRadius(separatorOuterRadius);

  const pie = d3.pie()
    .value(d => d.children.length)
    .sort(null);

  function getSectorColor(item, category, data) {
    const grayColor = "#DCDCDC";
    const values = {};
    data.forEach(cat => cat.children.forEach(child => {
      values[child.name.toUpperCase()] = child.value;
    }));

    const conditions = {
      "ВСЕ САМ": (values["МЫСЛИ"] <= 1 || values["ДЕЙСТВИЯ"] <= 1 || values["ШИРИНА"] === 0),
      "СОЦИУМ": (values["ПРАВИЛА"] === 0 || values["ЧУВСТВА"] === 0 || values["ШИРИНА"] === 0),
      "ВНУТР. МИР": (values["ИНТУИЦИЯ"] === 0 || values["ЗНАЧИМОСТЬ"] === 0 || values["ГИБКОСТЬ"] <= 1),
      "РЕАЛИЗАЦИЯ": (values["МЫСЛИ"] <= 1 || values["ПРАВИЛА"] === 0 || values["ИНТУИЦИЯ"] === 0),
      "ОТНОШЕНИЯ": (values["ДЕЙСТВИЯ"] <= 1 || values["ЧУВСТВА"] === 0 || values["ЗНАЧИМОСТЬ"] === 0),
      "СТАТУС": (values["ШИРИНА"] === 0 || values["ГЛУБИНА"] === 0 || values["ГИБКОСТЬ"] <= 1),
      "АЛЬТРУИЗМ": (values["МЫСЛИ"] <= 1 || values["ПРАВИЛА"] === 0 || values["ИНТУИЦИЯ"] === 0 || values["ЧУВСТВА"] === 0),
      "ЭГОИЗМ": (values["ШИРИНА"] === 0 || values["ГЛУБИНА"] === 0 || values["ГИБКОСТЬ"] <= 1 || values["ЧУВСТВА"] === 0),
      "ТВОРЕЦ": (values["МЫСЛИ"] <= 1 || values["ЧУВСТВА"] === 0 || values["ГИБКОСТЬ"] <= 1)
    };

    return conditions[item.name.toUpperCase()] ? grayColor : category.color;
  }

  const categoryArcs = rotatingGroup.selectAll(".category")
    .data(pie(data))
    .enter()
    .append("g")
    .attr("class", "category");

  categoryArcs.append("path")
    .attr("d", categoryArc)
    .attr("fill", d => d.data.color)
    .attr("class", "in-chart");

  const defs = svg.append("defs");

  const textPaths = defs.selectAll(".text-path")
    .data(pie(data))
    .enter()
    .append("path")
    .attr("class", "text-path")
    .attr("id", (d, i) => `text-path-${i}`)
    .attr("d", d => {
      const startAngle = d.startAngle;
      const endAngle = d.endAngle;
      const radius = categoryTextRadius;
      return d3.arc()({
        innerRadius: radius,
        outerRadius: radius,
        startAngle: startAngle,
        endAngle: endAngle
      });
    });

  categoryArcs.append("text")
    .append("textPath")
    .attr("xlink:href", (d, i) => `#text-path-${i}`)
    .attr("startOffset", "25%")
    .attr("text-anchor", "middle")
    .text(d => d.data.name)
    .attr("fill", "white")
    .style("font-family", "Arial, sans-serif")
    .style("font-weight", "bold")
    .style("font-size", "13px")
    .style("letter-spacing", "1px")
    .attr("class", "in-chart");

  data.forEach((category, categoryIndex) => {
    const categoryAngle = pie(data)[categoryIndex].startAngle;
    const categoryEndAngle = pie(data)[categoryIndex].endAngle;
    const angleStep = (categoryEndAngle - categoryAngle) / category.children.length;

    category.children.forEach((item, itemIndex) => {
      const startAngle = categoryAngle + itemIndex * angleStep;
      const endAngle = startAngle + angleStep;

      rotatingGroup.append("path")
        .attr("d", typeArc({startAngle, endAngle}))
        .attr("fill", "white")
        .attr("stroke", "lightgray")
        .attr("stroke-width", 1)
        .attr("class", "in-chart");

      const labelAngle = (startAngle + endAngle) / 2;
      const labelRadius = (typeInnerRadius + typeOuterRadius) / 2;
      const x = labelRadius * Math.cos(labelAngle - Math.PI / 2);
      const y = labelRadius * Math.sin(labelAngle - Math.PI / 2);

      rotatingGroup.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("transform", `rotate(${(labelAngle * 180 / Math.PI - 90)} ${x} ${y})`)
        .text(item.name)
        .style("font-family", "Arial, sans-serif")
        .style("font-weight", "bold")
        .style("font-size", "7px")
        .style("letter-spacing", "0.5px")
        .style("fill", "#333")
        .attr("class", "in-chart");

      rotatingGroup.append("path")
        .attr("d", separatorArc({startAngle, endAngle}))
        .attr("fill", "white")
        .attr("stroke", "gray")
        .attr("stroke-width", 1)
        .attr("class", "in-chart");

      const valueAngle = (startAngle + endAngle) / 2;
      const valueRadius = (separatorInnerRadius + separatorOuterRadius) / 2;
      const valueX = valueRadius * Math.cos(valueAngle - Math.PI / 2);
      const valueY = valueRadius * Math.sin(valueAngle - Math.PI / 2);

      rotatingGroup.append("text")
        .attr("x", valueX)
        .attr("y", valueY)
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("transform", `rotate(${(valueAngle * 180 / Math.PI - 90)} ${valueX} ${valueY})`)
        .text(item.value)
        .style("font-family", "Arial, sans-serif")
        .style("font-weight", "bold")
        .style("font-size", "7px")
        .style("fill", "#333")
        .attr("class", "in-chart");

      rotatingGroup.append("path")
        .attr("d", d3.arc()
          .innerRadius(scaleStartRadius)
          .outerRadius(scaleStartRadius + (centerRadius - scaleStartRadius) * item.value / 15)
          .startAngle(startAngle)
          .endAngle(endAngle)
        )
        .attr("fill", getSectorColor(item, category, data))
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .attr("class", "in-chart");
    });

    rotatingGroup.append("path")
      .attr("d", d3.arc()
        .innerRadius(centerRadius)
        .outerRadius(outerRadius)
        .startAngle(categoryAngle)
        .endAngle(categoryEndAngle)
      )
      .attr("fill", "none")
      .attr("stroke", "gray")
      .attr("stroke-width", 2)
      .attr("class", "in-chart");
  });

  rotatingGroup.append("circle")
    .attr("r", separatorInnerRadius)
    .attr("fill", "none")
    .attr("stroke", "gray")
    .attr("stroke-width", 2)
    .attr("class", "in-chart");

  for (let i = 1; i <= 14; i++) {
    const r = scaleStartRadius + (centerRadius - scaleStartRadius) * i / 15;
    rotatingGroup.append("circle")
      .attr("r", r)
      .attr("fill", "none")
      .attr("stroke", "lightgray")
      .attr("stroke-width", 0.5)
      .attr("class", "in-chart");
  }

  rotatingGroup.append("circle")
    .attr("r", centerRadius)
    .attr("fill", "white")
    .attr("stroke", "gray")
    .attr("stroke-width", 2)
    .attr("class", "in-chart");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-family", "Arial, sans-serif")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("ЦИФРОВАЯ АРХИТЕКТУРА ЛИЧНОСТИ")
    .attr("class", "title");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 50)
    .attr("text-anchor", "middle")
    .style("font-family", "Arial, sans-serif")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text(`${additionalInfo.name}`)
    .attr("class", "title");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 70)
    .attr("text-anchor", "middle")
    .style("font-family", "Arial, sans-serif")
    .style("font-size", "12px")
    .text(`${additionalInfo.birthDay}.${additionalInfo.birthMonth}.${additionalInfo.birthYear} - Год: ${additionalInfo.currentYear}`)
    .attr("class", "title");

  const downloadButton = svg.append("g")
    .attr("transform", `translate(${width - 30}, 25)`)
    .attr("class", "download-button")
    .style("cursor", "pointer");

  downloadButton.append("rect")
    .attr("width", 20)
    .attr("height", 20)
    .attr("fill", "white")
    .attr("stroke", "#DCDCDC");

  downloadButton.append("path")
    .attr("d", "M10,6 L10,14 M7,11 L10,14 L13,11")
    .attr("stroke", "#DCDCDC")
    .attr("stroke-width", 2)
    .attr("fill", "none");

  const downloadMenu = d3.select("body").append("div")
    .attr("class", "download-menu")
    .style("display", "none");

  downloadMenu.append("div")
    .text("Скачать")
    .attr("class", "download-title");

  const formatOptions = ["png", "jpg"];
  const formatButtons = downloadMenu.selectAll(".format-button")
    .data(formatOptions)
    .enter()
    .append("div")
    .attr("class", "format-button")
    .text(d => d.toUpperCase());

  downloadButton.on("click", function() {
    const menu = d3.select(".download-menu");
    menu.style("display", menu.style("display") === "none" ? "block" : "none");
  });

  function rotateChart() {
    rotatingGroup.attr("transform", `rotate(${rotationAngle})`);
  }

  let lastX = 0;
  let lastY = 0;

  rotationArea.on("mousedown touchstart", function(event) {
    d3.event.preventDefault();
    isRotating = true;
    const coords = d3.event.type === "touchstart" ? d3.event.touches[0] : d3.mouse(this);
    lastX = coords.clientX || coords[0];
    lastY = coords.clientY || coords[1];
    startAngle = rotationAngle;
    rotationArea.style("cursor", "grabbing");
  });

  d3.select(window).on("mousemove touchmove", function(event) {
      if (isRotating) {
        d3.event.preventDefault();
        const coords = d3.event.type === "touchmove" ? d3.event.touches[0] : d3.mouse(rotationArea.node());
        const currentX = coords.clientX || coords[0];
        const currentY = coords.clientY || coords[1];
        const dx = currentX - lastX;
        const dy = currentY - lastY;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        rotationAngle = (startAngle + angle + 360) % 360;
        rotateChart();
      }
    });

    d3.select(window).on("mouseup touchend touchcancel", function() {
      if (isRotating) {
        isRotating = false;
        rotationArea.style("cursor", "grab");
      }
    });

    initialRotation = rotationAngle;

    formatButtons.on("click", function(d) {
      const format = d;
      const svgNode = svg.node().cloneNode(true);
      const scale = 3;
      const padding = format === "jpg" ? 113 : 0;

      // Удаляем кнопку скачивания из копии SVG
      const downloadButton = svgNode.querySelector('.download-button');
      if (downloadButton) {
        downloadButton.remove();
      }

      // Применяем поворот к копии SVG
      const rotatingGroupCopy = svgNode.querySelector("g > g");
      rotatingGroupCopy.setAttribute("transform", `rotate(${rotationAngle})`);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      let exportWidth, exportHeight;
      if (format === "png") {
        exportWidth = width * scale;
        exportHeight = height * scale;

        // Удаляем верхние надписи для PNG
        const titleElements = svgNode.querySelectorAll('.title');
        titleElements.forEach(el => el.remove());

        // Центрируем диаграмму для PNG
        const chartGroup = svgNode.querySelector('g');
        chartGroup.setAttribute('transform', `translate(${width/2}, ${height/2})`);
      } else {
        exportWidth = (width + padding * 2) * scale;
        exportHeight = (height + padding * 2) * scale;
      }

      canvas.width = exportWidth;
      canvas.height = exportHeight;
      ctx.fillStyle = format === "jpg" ? "white" : "transparent";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svgNode);

      // Добавляем стили для текста
      svgString = svgString.replace('</svg>', `
        <style>
          text {
            font-family: Arial, sans-serif;
            font-weight: bold;
          }
        </style>
      </svg>`);

      const svgBlob = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"});
      const DOMURL = window.URL || window.webkitURL || window;
      const img = new Image();
      const svgUrl = DOMURL.createObjectURL(svgBlob);

      img.onload = function() {
        if (format === "png") {
          ctx.drawImage(img, 0, 0, exportWidth, exportHeight);
        } else {
          ctx.drawImage(img, padding * scale, padding * scale, width * scale, height * scale);
        }
        DOMURL.revokeObjectURL(svgUrl);

        canvas.toBlob(function(blob) {
          const url = DOMURL.createObjectURL(blob);
          const a = document.createElement("a");
          a.download = `diagram.${format}`;
          a.href = url;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          DOMURL.revokeObjectURL(url);
        }, `image/${format}`, format === 'jpg' ? 0.95 : 1);
      };

      img.src = svgUrl;
      d3.select(".download-menu").style("display", "none");
    });
  });
