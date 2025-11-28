"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/ui/dialog";
import { Button } from "@/ui/button";

export function useConfirmDeleteProjectModal() {
  const [open, setOpen] = useState(false);
  const [resolver, setResolver] = useState<null | ((value: boolean) => void)>(
    null
  );

  const confirm = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
      setOpen(true);
    });
  }, []);

  function handleClose(answer: boolean) {
    if (resolver) resolver(answer);
    setOpen(false);
  }

  const Modal = (
    <Dialog open={open} onOpenChange={() => handleClose(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir projeto</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-600">
          Tem certeza que deseja excluir este projeto?
        </p>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => handleClose(true)}>
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { confirm, Modal };
}
