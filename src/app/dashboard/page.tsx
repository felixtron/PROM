'use client';

import React, { useState, useEffect } from 'react';

// Datos estáticos/Mock de las campañas de marketing para el dashboard de ProM
const mockCampaignsData: Record<string, any[]> = {
  'tenant-1-alpha': [
    { id: '1', title: 'Pauta de Búsqueda Google Ads - ProSuite BPM', channel: 'Google Ads', spend: 250, clicks: 1200, impressions: 50000, status: 'Active' },
    { id: '2', title: 'Campaña Creativos Meta - Lanzamiento ProSuite Cloud', channel: 'Meta Ads', spend: 150, clicks: 450, impressions: 20000, status: 'Active' },
    { id: '3', title: 'Post Orgánico Lanzamiento Zernio', channel: 'Zernio', spend: 0, clicks: 80, impressions: 1500, status: 'Published' }
  ],
  'tenant-2-beta': [
    { id: '4', title: 'Google Display Ads - Reclutamiento Beta Corp', channel: 'Google Ads', spend: 500, clicks: 110, impressions: 80000, status: 'Active' },
    { id: '5', title: 'Video Campaña Meta - Servicios Financieros', channel: 'Meta Ads', spend: 350, clicks: 900, impressions: 30000, status: 'Active' }
  ]
};

export default function ProMDashboard() {
  const [activeTenant, setActiveTenant] = useState('tenant-1-alpha');
  const [role, setRole] = useState('superuser'); // El consultor opera como Superuser
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);

  // Cargar campañas cuando cambia el Tenant activo
  useEffect(() => {
    setCampaigns(mockCampaignsData[activeTenant] || []);
    setAiRecommendations([]); // Limpiar consejos previos
  }, [activeTenant]);

  // Invocar al Advisor de IA (conecta en background con Kimi-k2.6)
  const triggerAiAdvisor = async () => {
    setLoadingAi(true);
    try {
      // Calcular métricas agregadas del tenant actual
      const totalImpressions = campaigns.reduce((acc, c) => acc + c.impressions, 0);
      const totalClicks = campaigns.reduce((acc, c) => acc + c.clicks, 0);
      const totalSpend = campaigns.reduce((acc, c) => acc + c.spend, 0);

      const response = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenant,
          'x-user-role': role
        },
        body: JSON.stringify({
          metrics: {
            impressions: totalImpressions,
            clicks: totalClicks,
            spend: totalSpend
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        setAiRecommendations(data.recommendations);
      } else {
        setAiRecommendations(['No se pudo obtener el análisis de IA. Inténtalo de nuevo.']);
      }
    } catch (error) {
      setAiRecommendations(['[Fallback] El CTR general del tenant requiere optimización urgente en el copy creativo.']);
    } finally {
      setLoadingAi(false);
    }
  };

  // Enviar publicación a Zernio API
  const handlePublishZernio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setSubmittingPost(true);
    try {
      const response = await fetch('/api/zernio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenant,
          'x-user-role': role
        },
        body: JSON.stringify({
          campaign_id: campaigns[0]?.id || 'camp-default',
          content: newPostContent,
          platforms: ['telegram', 'twitter']
        })
      });
      const data = await response.json();
      if (data.success) {
        alert(`🎉 Contenido publicado con éxito vía Zernio! Post ID: ${data.zernio_post_id}`);
        // Agregar al listado local simulado
        setCampaigns([...campaigns, {
          id: String(Date.now()),
          title: `Post Orgánico: ${newPostContent.substring(0, 20)}...`,
          channel: 'Zernio',
          spend: 0,
          clicks: 0,
          impressions: 1,
          status: 'Published'
        }]);
        setNewPostContent('');
      }
    } catch (err) {
      alert('Error publicando el post.');
    } finally {
      setSubmittingPost(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      {/* HEADER DE PRO-M */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-700 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            🚀 ProM <span className="text-xs bg-indigo-500 text-white py-1 px-2.5 rounded-full font-medium">ProSuite Marketing</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Consola interna de administración, maquetación y optimización de pauta.</p>
        </div>

        {/* SELECTOR DE TENANT (CONTROL DE SUPERUSUARIO) */}
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <div>
            <label className="block text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Tenant (Cliente de ProSuite)</label>
            <select
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              value={activeTenant}
              onChange={(e) => setActiveTenant(e.target.value)}
            >
              <option value="tenant-1-alpha">Cliente Alpha (ProSuite BPM & Cloud)</option>
              <option value="tenant-2-beta">Cliente Beta (Finanzas Corporativas)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Rol de Ejecución</label>
            <span className="bg-indigo-950 text-indigo-400 border border-indigo-800 text-xs font-bold py-2 px-3 rounded-lg block uppercase">
              {role}
            </span>
          </div>
        </div>
      </div>

      {/* MÉTRICAS PRINCIPALES DEL TENANT */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Inversión Total</p>
          <p className="text-2xl font-bold mt-2 text-white">${campaigns.reduce((acc, c) => acc + c.spend, 0)} USD</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Clics Totales</p>
          <p className="text-2xl font-bold mt-2 text-white">{campaigns.reduce((acc, c) => acc + c.clicks, 0)}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Impresiones</p>
          <p className="text-2xl font-bold mt-2 text-white">{campaigns.reduce((acc, c) => acc + c.impressions, 0)}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">CTR Promedio</p>
          <p className="text-2xl font-bold mt-2 text-emerald-400">
            {campaigns.reduce((acc, c) => acc + c.impressions, 0) > 0
              ? ((campaigns.reduce((acc, c) => acc + c.clicks, 0) / campaigns.reduce((acc, c) => acc + c.impressions, 0)) * 100).toFixed(2)
              : '0.00'}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LISTADO DE CAMPAÑAS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Campañas y Contenidos Activos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-750 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Canal</th>
                    <th className="py-3 px-4">Campaña / Post</th>
                    <th className="py-3 px-4">Gasto</th>
                    <th className="py-3 px-4">Clics</th>
                    <th className="py-3 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-750 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-indigo-400">{camp.channel}</td>
                      <td className="py-3.5 px-4 text-white font-medium">{camp.title}</td>
                      <td className="py-3.5 px-4">${camp.spend} USD</td>
                      <td className="py-3.5 px-4">{camp.clicks}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-xs py-1 px-2.5 rounded-full font-semibold ${camp.status === 'Active' || camp.status === 'Published' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-700 text-slate-300'}`}>
                          {camp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CREAR NUEVO CONTENIDO ORGÁNICO (ZERNIO API LINK) */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">📢 Crear y Publicar Contenido Orgánico (Zernio API)</h3>
            <form onSubmit={handlePublishZernio} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1.5 uppercase">Texto de la Publicación (Canal: Twitter/Telegram)</label>
                <textarea
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500 h-28"
                  placeholder="Escribe el copy comercial que será enviado al validador del cliente..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submittingPost}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-5 rounded-lg text-sm transition-all shadow-md flex items-center gap-2"
              >
                {submittingPost ? 'Enviando a API...' : '🚀 Lanzar Post Multicanal con Zernio'}
              </button>
            </form>
          </div>
        </div>

        {/* CONSEJERO DE IA (PRO-M ADVISOR) */}
        <div className="space-y-6">
          <div className="bg-slate-850 border-2 border-indigo-500 rounded-xl p-6 shadow-indigo-950 shadow-md">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              🤖 ProM AI Advisor <span className="text-xs bg-indigo-500 py-0.5 px-2 rounded text-white">Live</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Sugerencias continuas basadas en analítica interpretada por Kimi-k2.6.</p>

            <button
              onClick={triggerAiAdvisor}
              disabled={loadingAi}
              className="mt-4 w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-indigo-500 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
            >
              {loadingAi ? 'Analizando con Kimi...' : '⚡ Generar Recomendaciones de Optimización'}
            </button>

            {/* RESPUESTA DE LA IA */}
            <div className="mt-6 space-y-4">
              {aiRecommendations.length > 0 ? (
                aiRecommendations.map((rec, index) => (
                  <div key={index} className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex gap-3 text-sm">
                    <span className="text-indigo-400 font-bold">#{index + 1}</span>
                    <p className="text-slate-300 leading-relaxed">{rec}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 text-sm italic">
                  Presiona el botón de arriba para que el agente de IA interprete el desempeño publicitario de este cliente.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
