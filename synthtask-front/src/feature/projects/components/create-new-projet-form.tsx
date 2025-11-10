import { Field, FieldGroup, FieldLabel, FieldSet } from "@/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";

export default function CreateNewProjectForm() {
  return (
    <FieldSet>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="project-name">Nome do Projeto</FieldLabel>
          <Input id="project-name" autoComplete="off" placeholder="Digite aqui o nome do projeto" />
        </Field>
        <Field>
          <FieldLabel htmlFor="board">Destino</FieldLabel>
          <Select defaultValue="">
            <SelectTrigger id="board">
              <SelectValue placeholder="Selecione o destino das tasks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="board-trello">Trello</SelectItem>
              <SelectItem value="board-jira">Jira</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field orientation="responsive">
          <Button type="submit">Criar</Button>
          <Button variant="outline" type="button">
            Cancelar
          </Button>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
