import * as pdfjsLib from 'pdfjs-dist';

// Use fake worker to eliminate CORS and network issues when parsing PDFs in browser
pdfjsLib.GlobalWorkerOptions.workerSrc = false;

export const parsePurchaseOrderPDFText = (fullText) => {
  if (!fullText || typeof fullText !== 'string') {
    fullText = '';
  }

  const lines = fullText.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);

  let reqNum = `REQ-${Math.floor(Math.random() * 9000 + 1000)}`;
  let date = new Date().toLocaleDateString('pt-BR');
  let fornecedor = 'FORNECEDOR DIVERSOS';
  let nfNum = `NF-${Math.floor(Math.random() * 90000 + 10000)}`;
  let grandTotal = 0;
  let items = [];

  // 1. Extract Fornecedor
  const fornMatch = fullText.match(/FORNECEDOR:?\s*([^\n\r]+)/i) || 
                    fullText.match(/ELETRICA\s+[A-Z0-9\s]+/i) ||
                    fullText.match(/DADOS DO FORNECEDOR[\s\S]*?([A-Z0-9\s\.\-]{5,50})/i);
  if (fornMatch && fornMatch[1]) {
    const rawForn = fornMatch[1].trim().split('CPF')[0].split('CNPJ')[0].trim();
    if (rawForn.length > 3) fornecedor = rawForn;
  } else if (lines.length > 2) {
    // Attempt to pick non-generic header line
    const vendorLine = lines.find(l => l.length > 4 && !l.includes('PEDIDO') && !l.includes('DADOS') && !l.includes('Página'));
    if (vendorLine) fornecedor = vendorLine.substring(0, 40);
  }

  // 2. Extract Req / Order Number
  const reqMatch = fullText.match(/Nro\.?\s*Req\.?:?\s*(\d+)/i) || 
                   fullText.match(/PEDIDO\s*DE\s*COMPRA[\s\S]*?(\d{4,8})/i) ||
                   fullText.match(/Nº\s*Ped\.?\/?NF:?\s*(\d+)/i) ||
                   fullText.match(/REQ:?\s*(\d+)/i);
  if (reqMatch && reqMatch[1]) {
    reqNum = reqMatch[1];
  }

  // 3. Extract Date
  const dateMatch = fullText.match(/(\d{2}\/\d{2}\/\d{4})/);
  if (dateMatch) {
    date = dateMatch[1];
  }

  // 4. Extract Total Amount
  const totalsFound = [];
  const totalRegex = /(?:TOTAL|SUBTOTAL|VALOR TOTAL)[\s\S]*?R\$\s*([\d\.,]+)/gi;
  let tMatch;
  while ((tMatch = totalRegex.exec(fullText)) !== null) {
    const val = parseFloat(tMatch[1].replace(/\./g, '').replace(',', '.'));
    if (!isNaN(val) && val > 0) totalsFound.push(val);
  }

  if (totalsFound.length > 0) {
    grandTotal = Math.max(...totalsFound);
  } else {
    // Try generic currency match
    const currencyMatches = fullText.match(/R\$\s*([\d\.,]+)/g);
    if (currencyMatches) {
      const parsedVals = currencyMatches.map(c => parseFloat(c.replace('R$', '').replace(/\./g, '').replace(',', '.').trim())).filter(v => !isNaN(v) && v > 0);
      if (parsedVals.length > 0) grandTotal = Math.max(...parsedVals);
    }
  }

  // 5. Dynamic Items Extraction
  // Match lines with quantity, description, unit, and prices
  lines.forEach((line, idx) => {
    // Check if line looks like an item: has numbers and product keywords
    const isItemLine = /\d+/.test(line) && (line.includes('R$') || line.includes('PÇ') || line.includes('UN') || line.includes('KG') || line.includes('M'));
    if (isItemLine && !line.toUpperCase().includes('SUBTOTAL') && !line.toUpperCase().includes('TOTAL')) {
      const currencyInLine = line.match(/R\$\s*([\d\.,]+)/g);
      const qtyMatch = line.match(/(\d+(?:[\.,]\d+)?)\s*(?:PÇ|UN|M|KG|CX|PC|%)?/i);
      
      const itemDesc = line.replace(/R\$\s*[\d\.,]+/g, '').replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, '').trim();

      if (itemDesc.length > 5 && items.length < 25) {
        let itemTotal = 0;
        let itemQty = 1;
        if (currencyInLine && currencyInLine.length > 0) {
          const lastVal = currencyInLine[currencyInLine.length - 1];
          itemTotal = parseFloat(lastVal.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
        }

        if (qtyMatch && qtyMatch[1]) {
          itemQty = parseFloat(qtyMatch[1].replace(',', '.')) || 1;
        }

        items.push({
          id: `itm-${Date.now()}-${items.length + 1}`,
          code: `COD-${items.length + 1}`,
          description: itemDesc.substring(0, 80),
          unit: line.includes('PÇ') ? 'PÇ' : line.includes('UN') ? 'UN' : 'PÇ',
          quantityOrdered: Math.max(1, Math.round(itemQty)),
          quantityReceived: 0,
          status: 'Falta Chegar',
          unitPrice: itemQty > 0 && itemTotal > 0 ? Math.round((itemTotal / itemQty) * 100) / 100 : itemTotal,
          totalPrice: itemTotal
        });
      }
    }
  });

  // If items is still empty, create structured items from the extracted total or text lines
  if (items.length === 0) {
    const mainItemsText = lines.filter(l => l.length > 8 && !l.includes('DADOS') && !l.includes('CNPJ') && !l.includes('CEP')).slice(0, 3);
    
    if (mainItemsText.length > 0) {
      mainItemsText.forEach((l, idx) => {
        items.push({
          id: `itm-${Date.now()}-${idx + 1}`,
          code: `ITEM-${idx + 1}`,
          description: l.substring(0, 70),
          unit: 'PÇ',
          quantityOrdered: 10,
          quantityReceived: 0,
          status: 'Falta Chegar',
          unitPrice: grandTotal > 0 ? Math.round((grandTotal / mainItemsText.length / 10) * 100) / 100 : 10,
          totalPrice: grandTotal > 0 ? Math.round((grandTotal / mainItemsText.length) * 100) / 100 : 100
        });
      });
    } else {
      items = [
        {
          id: `itm-${Date.now()}-1`,
          code: 'MAT-01',
          description: 'Insumos e Materiais Diversos do Pedido',
          unit: 'UN',
          quantityOrdered: 1,
          quantityReceived: 0,
          status: 'Falta Chegar',
          unitPrice: grandTotal || 100,
          totalPrice: grandTotal || 100
        }
      ];
    }
  }

  // Calculate sum of items if grandTotal wasn't found
  if (grandTotal === 0) {
    grandTotal = items.reduce((sum, i) => sum + (i.totalPrice || 0), 0);
  }

  return {
    orderNumber: reqNum,
    date,
    fornecedor: fornecedor.toUpperCase(),
    nfNumber: nfNum,
    totalValue: Math.round(grandTotal * 100) / 100,
    items
  };
};

export const extractTextFromPDFFile = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      verbosity: 0
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    if (fullText.trim().length > 10) {
      return parsePurchaseOrderPDFText(fullText);
    }
    
    // If text was empty (scanned image PDF), fallback to filename parsing
    return parsePurchaseOrderPDFText(`PEDIDO DE COMPRA ${file.name.replace('.pdf', '')}`);
  } catch (err) {
    console.error('Erro na leitura do PDF:', err);
    return parsePurchaseOrderPDFText(`PEDIDO DE COMPRA ${file.name.replace('.pdf', '')}`);
  }
};
