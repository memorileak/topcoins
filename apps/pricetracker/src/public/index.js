window.HIST_SIZE = localStorage.getItem('HIST_SIZE') || 24;

function getTopTokensData() {
  return new Promise((resolve, reject) => {
    //const API_URI = 'http://192.168.122.93:3000';
    const API_URI = '';
    $.ajax(`${API_URI}/toptokens`, {
      method: 'GET',
      success: (d) => resolve(d),
      error: (_, __, e) => reject(new Error(e)),
    });
  });
}

// [
//   {
//     latestPrice: 0.6468,
//     latestRSI14: 30.00,
//     intervalPrices: [
//       [0.6489, 1722523586773],
//       [0.6444, 1722523286942],
//       [0.642, 1722522988163],
//     ],
//     intervalVelocities: [23.29, 12.51],
//     intervalAccelerations: [0.04],
//     intervalRSI14: [30.00],
//     symbol: 'ARBUSDT',
//   },
// ]

function renderTopTokensTable(topTokens) {
  const rowHtmlList = topTokens.map((token) => {
    const isBullish = token.latestPrice > (token.intervalPrices[0]?.[0] || Infinity);
    return `
      <tr class="cursor-pointer" data-symbol="${token.symbol}">
        <td>${renderSymbol(token.symbol, isBullish)}</td>
        <td>${renderLatestPriceAndRSI14(token.latestPrice, token.latestRSI14, isBullish)}</td>
        <td>${renderPrices(token.intervalPrices)}</td>
        <td>${renderRSI14(token.intervalRSI14)}</td>
        <td>${renderVelocities(token.intervalVelocities)}</td>
      </tr>
    `
      .trim()
      .replace(/>\s+</g, '><');
  });
  $('#table_toptokens tbody').html(rowHtmlList.join(''));
  $('#table_toptokens tbody > tr').on('click', openBinanceWindow);
}

function openBinanceWindow(e) {
  const symbol = $(e.currentTarget).data('symbol');
  const breakpoint = symbol.length - 4;
  const targetCoin = symbol.slice(0, breakpoint);
  const baseCoin = symbol.slice(breakpoint);
  const binanceURL = `https://www.binance.com/en/trade/${targetCoin}_${baseCoin}?type=spot`;
  $(`<a href="${binanceURL}" target="_blank" rel="noopener noreferrer"></a>`)[0].click();
}

function renderSymbol(symbol, isBullish) {
  const breakpoint = symbol.length - 4;
  const targetCoin = symbol.slice(0, breakpoint);
  const baseCoin = symbol.slice(breakpoint);
  return `<span class="${isBullish ? 'text-success' : 'text-danger'}"><strong>${targetCoin}</strong>/${baseCoin}<span>`;
}

function renderLatestPriceAndRSI14(latestPrice, latestRSI14, isBullish) {
  return [
    `<span class="${isBullish ? 'text-success' : 'text-danger'}"><strong>${latestPrice}</strong><span>`,
    `<span class="${getRSI14ClassByValue(latestRSI14)}">${latestRSI14}</span>`,
  ].join('<br>');
}

function renderPrices(prices) {
  const priceChunks = separateInChunks(prices.slice(0, HIST_SIZE));
  return priceChunks
    .map((chunk) => `<span>${chunk.map((p) => p[0]).join(', ')}</span>`)
    .join('<br>');
}

function renderVelocities(velocities) {
  const velocChunks = separateInChunks(velocities.slice(0, HIST_SIZE));
  return velocChunks
    .map((chunk) =>
      chunk
        .map((v) => `<span class="${v > 0 ? 'text-success fw-bold' : 'text-danger'}">${v}</span>`)
        .join(', '),
    )
    .join('<br>');
}

//function renderAccelerations(accelerations) {
//  const acclrChunks = separateInChunks(accelerations.slice(0, HIST_SIZE));
//  return acclrChunks
//    .map((chunk) =>
//      chunk
//        .map((a) => `<span class="${a > 0 ? 'text-success fw-bold' : 'text-danger'}">${a}</span>`)
//        .join(', '),
//    )
//    .join('<br>');
//}

function renderRSI14(rsi14Values) {
  const rsi14Chunks = separateInChunks(rsi14Values.slice(0, HIST_SIZE));
  return rsi14Chunks
    .map((chunk) =>
      chunk.map((r) => `<span class="${getRSI14ClassByValue(r)}">${r}</span>`).join(', '),
    )
    .join('<br>');
}

function getRSI14ClassByValue(rsiValue) {
  let rClass = '';
  if (rsiValue <= 30) {
    rClass += 'text-danger';
  } else if (rsiValue >= 70) {
    rClass += 'text-success';
  }
  if (rsiValue <= 20 || rsiValue >= 80) {
    rClass += ' fw-bold';
  }
  return rClass;
}

function separateInChunks(list) {
  const CHUNK_SIZE = 6;
  let i = 0;
  const result = [];
  while (i < list.length) {
    result.push(list.slice(i, i + CHUNK_SIZE));
    i += CHUNK_SIZE;
  }
  return result;
}

function getTopTokensDataAndUpdateTable() {
  getTopTokensData().then((topTokens) => {
    renderTopTokensTable(topTokens);
  });
}

$(document).ready(() => {
  getTopTokensDataAndUpdateTable();
  window.setInterval(getTopTokensDataAndUpdateTable, 3000);
});
