// ARQUIVO GERADO. Não edite à mão.
// Gerado por scripts/gerar-tipos-local.mjs a partir de supabase/migrations.
// Com o projeto Supabase criado, regenere com `pnpm db:tipos`.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categorias: {
        Row: {
          id: string
          nome: string
          slug: string
          ordem: number
        }
        Insert: {
          id?: string
          nome: string
          slug: string
          ordem?: number
        }
        Update: {
          id?: string
          nome?: string
          slug?: string
          ordem?: number
        }
        Relationships: []
      }
      clientes: {
        Row: {
          id: string
          nome: string
          whatsapp: string | null
          instagram: string | null
          criado_em: string
        }
        Insert: {
          id?: string
          nome: string
          whatsapp?: string | null
          instagram?: string | null
          criado_em?: string
        }
        Update: {
          id?: string
          nome?: string
          whatsapp?: string | null
          instagram?: string | null
          criado_em?: string
        }
        Relationships: []
      }
      cliques_whatsapp: {
        Row: {
          id: number
          produto_id: string | null
          origem: string
          criado_em: string
        }
        Insert: {
          id?: number
          produto_id?: string | null
          origem: string
          criado_em?: string
        }
        Update: {
          id?: number
          produto_id?: string | null
          origem?: string
          criado_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliques_whatsapp_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          id: number
          saldo_inicial_centavos: number
          data_inicio_caixa: string
          preco_kg_filamento_centavos: number
          custo_energia_hora_centavos: number
          desgaste_hora_centavos: number
          embalagem_centavos: number
          taxa_falhas_pct: number
          margem_padrao_pct: number
        }
        Insert: {
          id?: number
          saldo_inicial_centavos?: number
          data_inicio_caixa?: string
          preco_kg_filamento_centavos?: number
          custo_energia_hora_centavos?: number
          desgaste_hora_centavos?: number
          embalagem_centavos?: number
          taxa_falhas_pct?: number
          margem_padrao_pct?: number
        }
        Update: {
          id?: number
          saldo_inicial_centavos?: number
          data_inicio_caixa?: string
          preco_kg_filamento_centavos?: number
          custo_energia_hora_centavos?: number
          desgaste_hora_centavos?: number
          embalagem_centavos?: number
          taxa_falhas_pct?: number
          margem_padrao_pct?: number
        }
        Relationships: []
      }
      encomenda_historico: {
        Row: {
          id: string
          encomenda_id: string
          status_anterior: string | null
          status_novo: string
          usuario_id: string | null
          criado_em: string
        }
        Insert: {
          id?: string
          encomenda_id: string
          status_anterior?: string | null
          status_novo: string
          usuario_id?: string | null
          criado_em?: string
        }
        Update: {
          id?: string
          encomenda_id?: string
          status_anterior?: string | null
          status_novo?: string
          usuario_id?: string | null
          criado_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "encomenda_historico_encomenda_id_fkey"
            columns: ["encomenda_id"]
            isOneToOne: false
            referencedRelation: "encomendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encomenda_historico_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      encomendas: {
        Row: {
          id: string
          numero: number
          cliente_id: string | null
          nome_contato: string
          whatsapp: string
          tipo: string
          quantidade: number
          descricao: string
          cores: string | null
          data_desejada: string | null
          imagem_referencia: string | null
          status: string
          valor_orcado_centavos: number | null
          previsao_entrega: string | null
          notas_internas: string | null
          venda_id: string | null
          consentimento_contato: boolean
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          numero?: number
          cliente_id?: string | null
          nome_contato: string
          whatsapp: string
          tipo: string
          quantidade?: number
          descricao: string
          cores?: string | null
          data_desejada?: string | null
          imagem_referencia?: string | null
          status?: string
          valor_orcado_centavos?: number | null
          previsao_entrega?: string | null
          notas_internas?: string | null
          venda_id?: string | null
          consentimento_contato: boolean
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          numero?: number
          cliente_id?: string | null
          nome_contato?: string
          whatsapp?: string
          tipo?: string
          quantidade?: number
          descricao?: string
          cores?: string | null
          data_desejada?: string | null
          imagem_referencia?: string | null
          status?: string
          valor_orcado_centavos?: number | null
          previsao_entrega?: string | null
          notas_internas?: string | null
          venda_id?: string | null
          consentimento_contato?: boolean
          criado_em?: string
          atualizado_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "encomendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encomendas_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos: {
        Row: {
          id: string
          data: string
          tipo: string
          categoria: string
          descricao: string
          valor_centavos: number
          forma_pagamento: string | null
          venda_id: string | null
          estorno_de: string | null
          comprovante: string | null
          criado_por: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          data?: string
          tipo: string
          categoria: string
          descricao: string
          valor_centavos: number
          forma_pagamento?: string | null
          venda_id?: string | null
          estorno_de?: string | null
          comprovante?: string | null
          criado_por?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          data?: string
          tipo?: string
          categoria?: string
          descricao?: string
          valor_centavos?: number
          forma_pagamento?: string | null
          venda_id?: string | null
          estorno_de?: string | null
          comprovante?: string | null
          criado_por?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_estorno_de_fkey"
            columns: ["estorno_de"]
            isOneToOne: false
            referencedRelation: "lancamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      limites_envio: {
        Row: {
          id: number
          chave: string
          criado_em: string
        }
        Insert: {
          id?: number
          chave: string
          criado_em?: string
        }
        Update: {
          id?: number
          chave?: string
          criado_em?: string
        }
        Relationships: []
      }
      marca: {
        Row: {
          id: number
          nome: string
          whatsapp: string | null
          instagram: string | null
          texto_sobre: string | null
          foto_criadores: string | null
        }
        Insert: {
          id?: number
          nome?: string
          whatsapp?: string | null
          instagram?: string | null
          texto_sobre?: string | null
          foto_criadores?: string | null
        }
        Update: {
          id?: number
          nome?: string
          whatsapp?: string | null
          instagram?: string | null
          texto_sobre?: string | null
          foto_criadores?: string | null
        }
        Relationships: []
      }
      perfis: {
        Row: {
          id: string
          nome: string
          papel: string
          ativo: boolean
          criado_em: string
        }
        Insert: {
          id: string
          nome: string
          papel?: string
          ativo?: boolean
          criado_em?: string
        }
        Update: {
          id?: string
          nome?: string
          papel?: string
          ativo?: boolean
          criado_em?: string
        }
        Relationships: []
      }
      produto_fotos: {
        Row: {
          id: string
          produto_id: string
          caminho: string
          ordem: number
        }
        Insert: {
          id?: string
          produto_id: string
          caminho: string
          ordem?: number
        }
        Update: {
          id?: string
          produto_id?: string
          caminho?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "produto_fotos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          id: string
          nome: string
          slug: string
          categoria_id: string | null
          descricao_curta: string | null
          descricao: string | null
          preco_centavos: number | null
          custo_centavos: number | null
          gramas_filamento: number | null
          minutos_impressao: number | null
          cores: string[]
          ativo: boolean
          destaque: boolean
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          nome: string
          slug: string
          categoria_id?: string | null
          descricao_curta?: string | null
          descricao?: string | null
          preco_centavos?: number | null
          custo_centavos?: number | null
          gramas_filamento?: number | null
          minutos_impressao?: number | null
          cores?: string[]
          ativo?: boolean
          destaque?: boolean
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          nome?: string
          slug?: string
          categoria_id?: string | null
          descricao_curta?: string | null
          descricao?: string | null
          preco_centavos?: number | null
          custo_centavos?: number | null
          gramas_filamento?: number | null
          minutos_impressao?: number | null
          cores?: string[]
          ativo?: boolean
          destaque?: boolean
          criado_em?: string
          atualizado_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      venda_itens: {
        Row: {
          id: string
          venda_id: string
          produto_id: string | null
          descricao: string
          cor: string | null
          quantidade: number
          preco_unitario_centavos: number
          custo_unitario_centavos: number | null
          total_centavos: number | null
        }
        Insert: {
          id?: string
          venda_id: string
          produto_id?: string | null
          descricao: string
          cor?: string | null
          quantidade: number
          preco_unitario_centavos: number
          custo_unitario_centavos?: number | null
          total_centavos?: never
        }
        Update: {
          id?: string
          venda_id?: string
          produto_id?: string | null
          descricao?: string
          cor?: string | null
          quantidade?: number
          preco_unitario_centavos?: number
          custo_unitario_centavos?: number | null
          total_centavos?: never
        }
        Relationships: [
          {
            foreignKeyName: "venda_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venda_itens_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      venda_pagamentos: {
        Row: {
          id: string
          venda_id: string
          data: string
          forma: string
          valor_centavos: number
          lancamento_id: string | null
          criado_em: string
        }
        Insert: {
          id?: string
          venda_id: string
          data: string
          forma: string
          valor_centavos: number
          lancamento_id?: string | null
          criado_em?: string
        }
        Update: {
          id?: string
          venda_id?: string
          data?: string
          forma?: string
          valor_centavos?: number
          lancamento_id?: string | null
          criado_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "venda_pagamentos_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venda_pagamentos_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          id: string
          numero: number
          data_venda: string
          cliente_id: string | null
          canal: string
          subtotal_centavos: number
          desconto_centavos: number
          frete_centavos: number
          total_centavos: number
          pago_centavos: number
          status_pagamento: string
          cancelada: boolean
          motivo_cancelamento: string | null
          cancelada_em: string | null
          encomenda_id: string | null
          observacoes: string | null
          criado_por: string | null
          criado_em: string
        }
        Insert: {
          id?: string
          numero?: number
          data_venda?: string
          cliente_id?: string | null
          canal: string
          subtotal_centavos?: number
          desconto_centavos?: number
          frete_centavos?: number
          total_centavos?: number
          pago_centavos?: number
          status_pagamento?: string
          cancelada?: boolean
          motivo_cancelamento?: string | null
          cancelada_em?: string | null
          encomenda_id?: string | null
          observacoes?: string | null
          criado_por?: string | null
          criado_em?: string
        }
        Update: {
          id?: string
          numero?: number
          data_venda?: string
          cliente_id?: string | null
          canal?: string
          subtotal_centavos?: number
          desconto_centavos?: number
          frete_centavos?: number
          total_centavos?: number
          pago_centavos?: number
          status_pagamento?: string
          cancelada?: boolean
          motivo_cancelamento?: string | null
          cancelada_em?: string | null
          encomenda_id?: string | null
          observacoes?: string | null
          criado_por?: string | null
          criado_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_encomenda_fk"
            columns: ["encomenda_id"]
            isOneToOne: false
            referencedRelation: "encomendas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vw_a_receber: {
        Row: {
          id: string | null
          numero: number | null
          data_venda: string | null
          cliente: string | null
          total_centavos: number | null
          pago_centavos: number | null
          aberto_centavos: number | null
        }
        Relationships: []
      }
      vw_produtos_mais_vendidos: {
        Row: {
          produto_id: string | null
          nome: string | null
          quantidade: number | null
          total_centavos: number | null
          primeira_venda: string | null
          ultima_venda: string | null
        }
        Relationships: []
      }
      vw_resumo_mensal: {
        Row: {
          mes: string | null
          entradas_centavos: number | null
          saidas_centavos: number | null
          resultado_centavos: number | null
          qtd_vendas: number | null
          faturamento_centavos: number | null
          ticket_medio_centavos: number | null
        }
        Relationships: []
      }
      vw_saldo_caixa: {
        Row: {
          saldo_centavos: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cancelar_venda: {
        Args: {
          p_venda: string
          p_motivo: string
        }
        Returns: undefined
      }
      consumir_limite_envio: {
        Args: {
          p_chave: string
          p_maximo?: number
          p_janela?: unknown
        }
        Returns: boolean
      }
      eh_admin: {
        Args: never
        Returns: boolean
      }
      eh_equipe: {
        Args: never
        Returns: boolean
      }
      recalcular_venda: {
        Args: {
          p_venda: string
        }
        Returns: undefined
      }
      registrar_pagamento: {
        Args: {
          p_venda: string
          p_valor: number
          p_forma: string
          p_data?: string
        }
        Returns: string
      }
      registrar_venda: {
        Args: {
          p_data: string
          p_cliente: string
          p_canal: string
          p_itens: Json
          p_desconto?: number
          p_frete?: number
          p_valor_pago?: number
          p_forma?: string
          p_encomenda?: string
          p_observacoes?: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])> =
  (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never
