/**
 * Hooks de queries centralizados
 * Requirements: 6.2
 */

// Cerimônias e Vagas
export { useVagasPorCerimonia, calcularVagasDisponiveis } from './useCerimoniasVagas';
export { useCerimoniasFuturas, useCerimoniasAdmin, useCerimoniasSelect } from './useCerimonias';

// Perfis e Anamneses
export { useProfiles, useAnamneses, useUserAnamnese, useMeuPerfil } from './useProfiles';

// Inscrições
export {
  useMinhasInscricoes,
  useInscricoesAdmin,
  useHistoricoInscricoes,
  useCerimoniasProximas,
  useHistoricoCerimoniasAdmin,
  useParticipantesCerimonia,
  type CerimoniaPassada,
  type ParticipanteCerimonia,
} from './useInscricoes';

// Histórico de Consagrações (Admin)
export { 
  useHistoricoConsagracoes, 
  useUpdateObservacao, 
  calcularStats,
  type ConsagracaoHistorico,
  type HistoricoStats,
} from './useHistoricoConsagracoes';

// Depoimentos
export { 
  useDepoimentosInfinito, 
  useDepoimentosPendentes, 
  useMeusDepoimentosPendentes,
  useMeusDepoimentosAprovados 
} from './useDepoimentos';

// Roles
export { useRoles, useUserRoles, getUserRoleFromData } from './useRoles';

// Notificações
export { useNotificacoes, getUnreadCount } from './useNotificacoes';

// Galeria
export {
  useGaleria,
  useGaleriaByCerimonia,
  useUploadGaleria,
  useUpdateGaleria,
  useDeleteGaleria,
} from './useGaleria';

// Dashboard Index Page (Req 1, 2, 3, 4)
export { useLatestPhotos } from './useLatestPhotos';
export { useUpcomingCeremonies, type CerimoniasComVagas } from './useUpcomingCeremonies';
export { useMyInscriptions, type MyInscription } from './useMyInscriptions';
export { useMyTestimonials, type MyTestimonial } from './useMyTestimonials';

// Permissões
export {
  usePermissoesDisponiveis,
  useMinhasPermissoes,
  useTemPermissao,
  useTemAlgumaPermissao,
  useTodasPermissoesUsuarios,
  useConcederPermissao,
  useRevogarPermissao,
  type Permissao,
  type UserPermissao,
  type PermissaoNome,
} from './usePermissoes';

// Pagamentos
export { usePagamentosAdmin, usePagamentosProdutos, type Pagamento } from './usePagamentos';

// Cursos e Eventos
export {
  useCursosFuturos,
  useCursosAdmin,
  useMinhasInscricoesCursos,
  useInscricoesCursosAdmin,
  useVagasCursos,
  useCreateCurso,
  useUpdateCurso,
  useDeleteCurso,
  useInscreverCurso,
  useCancelarInscricaoCurso,
  useAtualizarPagamentoCurso,
} from './useCursos';

// Fluxo de Caixa
export {
  useCategoriasFinanceiras,
  useTransacoes,
  useResumoFinanceiro,
  useDadosMensais,
  useCreateTransacao,
  useUpdateTransacao,
  useDeleteTransacao,
  useCreateCategoria,
} from './useFluxoCaixa';

// Lista de Espera
export {
  useMinhaListaEspera,
  usePosicaoListaEspera,
  useEntrarListaEspera,
  useSairListaEspera,
} from './useListaEspera';

// Chat interno
export {
  useConversas,
  useMensagens,
  useEnviarMensagem,
  useGetOrCreateConversa,
  useTotalNaoLidas,
  type Conversa,
  type Mensagem,
} from './useChat';

// Confirmação de presença
export { useConfirmarPresenca } from './useConfirmacaoPresenca';

// Materiais / Estudos
export {
  useMateriais,
  useMateriaisAdmin,
  useMaterial,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
  CATEGORIAS_MATERIAIS,
  type CategoriaMaterial,
} from './useMateriais';

// Interações em Materiais (Curtidas e Comentários)
export {
  useCurtidasMaterial,
  useUsuarioCurtiu,
  useToggleCurtida,
  useComentariosMaterial,
  useCreateComentario,
  useDeleteComentario,
  type Curtida,
  type CurtidaComUsuario,
  type Comentario,
  type ComentarioComUsuario,
} from './useMateriaisInteracoes';
