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
  const [role] = useState('superuser'); // El consultor opera como Superuser
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);
  
  // Pestaña Activa: 'performance' o 'brand'
  const [activeTab, setActiveTab] = useState<'performance' | 'brand'>('performance');

  // Estados de Onboarding del Tenant
  const [loadingTenant, setLoadingTenant] = useState(false);
  const [brandIdentity, setBrandIdentity] = useState('');
  const [toneOfVoice, setToneOfVoice] = useState('Professional');
  const [brandBookText, setBrandBookText] = useState('');
  const [objective, setObjective] = useState('');
  const [audience, setAudience] = useState('');
  const [budget, setBudget] = useState(1000);
  const [kpis, setKpis] = useState('');

  // Estados para subida de archivos
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Cargar campañas y contexto del Tenant cuando cambia el Tenant activo
  useEffect(() => {
    setCampaigns(mockCampaignsData[activeTenant] || []);
    setAiRecommendations([]); // Limpiar consejos previos
    fetchTenantOnboarding(activeTenant);
  }, [activeTenant]);

  // Cargar datos de Onboarding reales de la API
  const fetchTenantOnboarding = async (tenantId: string) => {
    setLoadingTenant(true);
    try {
      const response = await fetch('/api/tenant/onboarding', {
        headers: {
          'x-tenant-id': tenantId,
          'x-user-role': role,
        }
      });
      const data = await response.json();
      if (data.success && data.context) {
        const ctx = data.context;
        setBrandIdentity(ctx.brandIdentity || '');
        setToneOfVoice(ctx.toneOfVoice || 'Professional');
        setBrandBookText(ctx.brandBookText || '');
        if (ctx.activeBrief) {
          setObjective(ctx.activeBrief.objective || '');
          setAudience(ctx.activeBrief.audience || '');
          setBudget(ctx.activeBrief.budget || 1000);
          setKpis(ctx.activeBrief.kpis || '');
        } else {
          setObjective('');
          setAudience('');
          setBudget(1000);
          setKpis('');
        }
      }
    } catch (e) {
      console.error('Error cargando onboarding:', e);
    } finally {
      setLoadingTenant(false);
    }
  };

  // Guardar datos de Onboarding a la API
  const handleSaveOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingTenant(true);
    try {
      const response = await fetch('/api/tenant/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenant,
          'x-user-role': role,
        },
        body: JSON.stringify({
          brandIdentity,
          toneOfVoice,
          brandBookText,
          activeBrief: {
            objective,
            audience,
            budget,
            kpis,
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('🎉 ¡Onboarding y Brand Book guardados con éxito!');
      } else {
        alert('Error guardando configuración.');
      }
    } catch (err) {
      alert('Error en el servidor al guardar.');
    } finally {
      setLoadingTenant(false);
    }
  };

  // Subir archivo PDF o TXT de diseño
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];
    setUploadingFile(true);
    setUploadStatus('Procesando archivo y extrayendo texto...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/tenant/upload', {
        method: 'POST',
        headers: {
          'x-tenant-id': activeTenant,
          'x-user-role': role,
        },
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setBrandBookText(data.context.brandBookText || '');
        setUploadStatus(`✅ ¡Cargado con éxito! Extraídos ${data.textLength} caracteres de "${data.fileName}".`);
      } else {
        setUploadStatus(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setUploadStatus('❌ Error al subir el archivo.');
    } finally {
      setUploadingFile(false);
    }
  };

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
            🚀 ProM <span className="text-xs bg-indigo-500 text-white py-1 px-2.5 rounded-full font-medium font-mono">ProSuite Marketing</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Consola interna de administración, onboarding de marca y optimización de pauta.</p>
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

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <div className="flex border-b border-slate-850 mb-8 gap-4">
        <button
          onClick={() => setActiveTab('performance')}
          className={`pb-4 px-2 text-sm font-semibold border-b-2 transition-all ${activeTab === 'performance' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          📊 Desempeño y Campañas
        </button>
        <button
          onClick={() => setActiveTab('brand')}
          className={`pb-4 px-2 text-sm font-semibold border-b-2 transition-all ${activeTab === 'brand' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          🏷️ Onboarding de Marca & Guías
        </button>
      </div>

      {activeTab === 'performance' ? (
        <>
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

              {/* CREAR NUEVO CONTENIDO ORGÁNICO */}
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

            {/* CONSEJERO DE IA (PRO-M ADVISOR CONTEXTUALIZADO) */}
            <div className="space-y-6">
              <div className="bg-slate-850 border-2 border-indigo-500 rounded-xl p-6 shadow-indigo-950 shadow-md">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  🤖 ProM AI Advisor <span className="text-xs bg-indigo-500 py-0.5 px-2 rounded text-white font-mono">Real-Kimi</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">Sugerencias continuas basadas en la analítica de pauta e hiper-personalizadas por el perfil de marca del Tenant.</p>

                {/* Resumen breve del onboarding inyectado */}
                <div className="mt-4 bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs space-y-1">
                  <div className="text-slate-400"><strong className="text-slate-300">Tono activo:</strong> {toneOfVoice}</div>
                  <div className="text-slate-400 truncate"><strong className="text-slate-300">Meta:</strong> {objective || 'Sin especificar'}</div>
                </div>

                <button
                  onClick={triggerAiAdvisor}
                  disabled={loadingAi}
                  className="mt-4 w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-indigo-500 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                >
                  {loadingAi ? 'Invocando Kimi-k2.6...' : '⚡ Generar Recomendaciones de Optimización'}
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
                      Presiona el botón de arriba para que el agente de IA interprete el desempeño publicitario cruzándolo con la guía de marca y onboarding del Tenant.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* PESTAÑA DE ONBOARDING & BRAND BOOK */
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 max-w-4xl mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">🏷️ Configuración de Marca y Onboarding del Cliente</h2>
            <p className="text-slate-400 text-sm mt-1">Establece la identidad del cliente, tono creativo y objetivos clave de pauta para que el AI Advisor realice análisis quirúrgicos.</p>
          </div>

          {loadingTenant ? (
            <div className="text-center py-12 text-slate-400 italic">Cargando perfil de marca del Tenant...</div>
          ) : (
            <form onSubmit={handleSaveOnboarding} className="space-y-6">
              {/* Sección 1: Identidad del Negocio */}
              <div className="space-y-4 border-b border-slate-700 pb-6">
                <h3 className="text-sm font-bold uppercase text-indigo-400 tracking-wider">Sección 1: Identidad del Negocio</h3>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">¿Qué vende la empresa? (Propuesta de valor única)</label>
                  <textarea
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500 h-24"
                    placeholder="Ej. SaaS de firmas electrónicas, consultoría legal corporativa..."
                    value={brandIdentity}
                    onChange={(e) => setBrandIdentity(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Tono de Voz del Copywriting</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                      value={toneOfVoice}
                      onChange={(e) => setToneOfVoice(e.target.value)}
                    >
                      <option value="Professional">Profesional y Corporativo</option>
                      <option value="Casual">Casual, Cercano y Amistoso</option>
                      <option value="Technical">Técnico, Analítico y Preciso</option>
                      <option value="Adventurous">Aventurero, Enérgico e Inspiracional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Guía de Diseño / Brandbook (Carga PDF o TXT)</label>
                    <input
                      type="file"
                      accept=".pdf,.txt"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="block w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-650 cursor-pointer focus:outline-none"
                    />
                    {uploadStatus && (
                      <p className="text-xs mt-2 text-slate-300 leading-tight font-mono">{uploadStatus}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Texto Extraído del Brandbook o Guía de Diseño</label>
                  <textarea
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-400 font-mono focus:outline-none focus:border-indigo-500 h-28"
                    placeholder="El texto plano de la guía de diseño se reflejará aquí tras cargar un archivo, o puedes ingresarlo manualmente..."
                    value={brandBookText}
                    onChange={(e) => setBrandBookText(e.target.value)}
                  />
                </div>
              </div>

              {/* Sección 2: Briefing de Campaña Activa */}
              <div className="space-y-4 pb-6">
                <h3 className="text-sm font-bold uppercase text-indigo-400 tracking-wider">Sección 2: Objetivos y Campaña Activa</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Objetivo Comercial de Campaña</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                      placeholder="Ej. Generación de Leads calificados para Demo"
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Audiencia Objetivo (Buyer Persona)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                      placeholder="Ej. Directores de Finanzas / CFOs en México"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Presupuesto Mensual Planeado (USD)</label>
                    <input
                      type="number"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">KPIs de Éxito esperados</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                      placeholder="Ej. CPA menor a $20 USD, CTR mayor al 2%"
                      value={kpis}
                      onChange={(e) => setKpis(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="flex justify-end gap-4 border-t border-slate-700 pt-6">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-all shadow-md"
                >
                  💾 Guardar Onboarding y Sincronizar IA
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
