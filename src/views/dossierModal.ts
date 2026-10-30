import { layout } from './layout';

export function dossierModalView(): string {
  const folio = 'VEKTOR-001';
  const body = `<div class="vektor-watermark">VEKTOR · AUDIT · ${folio} · CONFIDENTIAL</div>
  <h2 class="font-display text-xl mb-4">Dossier Modal</h2>
  <button onclick="genDossier()" class="px-4 py-2 bg-vektor-cyan text-vektor-void font-bold rounded">Download Official Dossier (PDF)</button>
  <script>
  async function genDossier(){const r=await api('/api/v1/intelligence/reports/generate',{method:'POST',body:JSON.stringify({subjectName:'Demo Subject'})});const d=await r.json();if(d.reportId){window.open('/api/v1/intelligence/reports/'+d.reportId+'/download','_blank');}}
  </script>`;
  return layout('Dossier', body);
}
