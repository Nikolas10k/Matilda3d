"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CampoRotulado } from "@/components/painel/elementos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { salvarCliente } from "@/server/actions/encomendas";

type Valores = { id?: string; nome: string; whatsapp: string; instagram: string };

/** Cadastro e edição de cliente (dados mínimos, LGPD: nome, WhatsApp e Instagram). */
export function FormularioCliente({ inicial }: { inicial: Valores }) {
  const router = useRouter();
  const [v, setV] = useState(inicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, iniciar] = useTransition();
  const novo = !inicial.id;

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    iniciar(async () => {
      const r = await salvarCliente(v);
      if (!r.ok) {
        setErros(r.campos ?? {});
        toast.error(r.erro);
        return;
      }
      setErros({});
      toast.success(novo ? "Cliente cadastrado!" : "Cliente atualizado!");
      if (novo && r.id) router.push(`/admin/clientes/${r.id}`);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <CampoRotulado id="cli-nome" rotulo="Nome" erro={erros.nome}>
          <Input id="cli-nome" value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })} autoComplete="off" />
        </CampoRotulado>
        <CampoRotulado id="cli-whatsapp" rotulo="WhatsApp" erro={erros.whatsapp}>
          <Input id="cli-whatsapp" inputMode="tel" placeholder="(00) 00000-0000" value={v.whatsapp} onChange={(e) => setV({ ...v, whatsapp: e.target.value })} />
        </CampoRotulado>
        <CampoRotulado id="cli-instagram" rotulo="Instagram" erro={erros.instagram}>
          <Input id="cli-instagram" placeholder="@usuario" autoCapitalize="none" value={v.instagram} onChange={(e) => setV({ ...v, instagram: e.target.value })} />
        </CampoRotulado>
      </div>
      <p className="text-sm text-ink-muted">Guardamos só nome, WhatsApp e Instagram. Não peça CPF, endereço nem data de nascimento.</p>
      <Button type="submit" disabled={salvando} className="self-start">
        {salvando ? "Salvando…" : novo ? "Cadastrar cliente" : "Salvar alterações"}
      </Button>
    </form>
  );
}
