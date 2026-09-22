import { FiscalConfig, FiscalInvoice, Sale } from '../types';

/**
 * Calculates modulo 11 check digit for Brazilian fiscal access key (44 digits)
 */
function calculateDvMod11(base43: string): number {
  let multiplier = 2;
  let sum = 0;
  for (let i = base43.length - 1; i >= 0; i--) {
    sum += parseInt(base43.charAt(i), 10) * multiplier;
    multiplier = multiplier === 9 ? 2 : multiplier + 1;
  }
  const remainder = sum % 11;
  const dv = 11 - remainder;
  return dv === 0 || dv >= 10 ? 0 : dv;
}

/**
 * Generates an official 44-digit SEFAZ Access Key for NFC-e (Mod 65) or NF-e (Mod 55)
 */
export function generateAccessKey(
  uf: string = '35', // SP = 35
  date: Date = new Date(),
  cnpjDigits: string,
  model: '65' | '55' = '65', // 65 = NFC-e, 55 = NF-e
  serie: number = 1,
  nNF: number,
  tpEmis: string = '1', // 1 = Normal, 9 = Contingência
): string {
  const cleanCnpj = cnpjDigits.replace(/\D/g, '').padStart(14, '0');
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const aamm = `${yy}${mm}`;
  const modStr = model;
  const serieStr = String(serie).padStart(3, '0');
  const nNFStr = String(nNF).padStart(9, '0');
  const tpEmisStr = tpEmis;
  // 8 random numeric digits for cNF
  const cNF = Math.floor(10000000 + Math.random() * 90000000).toString();
  
  const base43 = `${uf}${aamm}${cleanCnpj}${modStr}${serieStr}${nNFStr}${tpEmisStr}${cNF}`;
  const dv = calculateDvMod11(base43);
  return `${base43}${dv}`;
}

/**
 * Simulates / Processes NFC-e Transmission to SEFAZ or via Fiscal API
 */
export async function emitNfce(
  sale: Sale,
  config: FiscalConfig,
  invoiceNumber: number,
): Promise<FiscalInvoice> {
  // Simulate network round-trip to SEFAZ
  await new Promise((resolve) => setTimeout(resolve, 600));

  const now = new Date();
  const accessKey = generateAccessKey('35', now, config.cnpj, '65', 1, invoiceNumber, '1');
  const protocol = `135${now.getFullYear().toString().slice(-2)}${Math.floor(100000000 + Math.random() * 900000000)}`;

  // IBPT estimated tax (~24.5% total average for retail clothing & cosmetics)
  const tributosAproximados = Math.round(sale.total * 0.245 * 100) / 100;

  // Build standard NFC-e Consultation QR Code URL (SEFAZ SP standard format)
  // Format: https://www.nfce.fazenda.sp.gov.br/qrcode?p=chNFe|2|tpAmb|cIdToken|cHashQRCode
  const qrCodeUrl = `https://www.nfce.fazenda.sp.gov.br/qrcode?p=${accessKey}|2|${config.environment === 'producao' ? '1' : '2'}|${config.cscId}|${config.cscToken.slice(0, 10)}`;

  // Simulated minimal standard NFe XML for customer download
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe${accessKey}" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <natOp>VENDA DE MERCADORIA NO VAREJO</natOp>
        <mod>65</mod>
        <serie>1</serie>
        <nNF>${invoiceNumber}</nNF>
        <dhEmi>${now.toISOString()}</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>3549607</cMunFG>
        <tpImp>4</tpImp>
        <tpEmis>1</tpEmis>
        <tpAmb>${config.environment === 'producao' ? '1' : '2'}</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>1</indPres>
      </ide>
      <emit>
        <CNPJ>${config.cnpj.replace(/\D/g, '')}</CNPJ>
        <xNome>${config.companyName}</xNome>
        <xFant>${config.tradeName}</xFant>
        <enderEmit>
          <xLgr>${config.address.street}</xLgr>
          <nro>${config.address.number}</nro>
          <xBairro>${config.address.neighborhood}</xBairro>
          <cMun>3549607</cMun>
          <xMun>${config.address.city}</xMun>
          <UF>${config.address.state}</UF>
          <CEP>${config.address.zipCode.replace(/\D/g, '')}</CEP>
        </enderEmit>
        <IE>${config.stateRegistration.replace(/\D/g, '')}</IE>
        <CRT>${config.crt}</CRT>
      </emit>
      <dest>
        ${sale.customerCpf ? `<CPF>${sale.customerCpf.replace(/\D/g, '')}</CPF>` : ''}
        ${sale.customerName ? `<xNome>${sale.customerName}</xNome>` : '<xNome>CONSUMIDOR FINAL</xNome>'}
      </dest>
      <total>
        <ICMSTot>
          <vProd>${sale.subtotal.toFixed(2)}</vProd>
          <vDesc>${sale.discount.toFixed(2)}</vDesc>
          <vNF>${sale.total.toFixed(2)}</vNF>
          <vTotTrib>${tributosAproximados.toFixed(2)}</vTotTrib>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>${config.environment === 'producao' ? '1' : '2'}</tpAmb>
      <verAplic>SP_NFCe_PL009_V4</verAplic>
      <chNFe>${accessKey}</chNFe>
      <dhRecbto>${now.toISOString()}</dhRecbto>
      <nProt>${protocol}</nProt>
      <digVal>zF8hKwP90w9s+M1w==</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;

  return {
    id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    saleId: sale.id,
    saleCode: sale.code,
    type: 'NFC-e',
    number: invoiceNumber,
    series: 1,
    issuedAt: now.toISOString(),
    accessKey,
    protocol,
    status: 'autorizada',
    qrCodeUrl,
    customerCpf: sale.customerCpf,
    customerName: sale.customerName,
    totalAmount: sale.total,
    tributosAproximados,
    xmlContent,
  };
}

export const FiscalService = {
  emitNfce,
  generateAccessKey,
};
