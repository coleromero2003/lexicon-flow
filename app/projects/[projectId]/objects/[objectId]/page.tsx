import { notFound } from "next/navigation";
import { remark } from "remark";
import html from "remark-html";

import {
  ObjectFilesCard,
  ObjectHeader,
  ObjectLexiconCard,
  ObjectMetadataCard,
  ObjectRelationsCard,
  ObjectSubtasksCard,
  type RelationDisplayItem,
} from "@/components/objects";
import { ObjectDescription } from "@/components/objects/object-description";
import { createClient } from "@/lib/supabase/server";
import {
  objectService,
  objectRelationService,
  objectSubtaskService,
  objectFileService,
  objectLexiconService,
} from "@/lib/services";
import type { ObjectRelation, ObjectSubtask, ScadaObject } from "@/lib/supabase/models";

interface ObjectPageParams {
  projectId: string;
  objectId: string;
}

async function renderDescription(markdown: string | null) {
  if (!markdown) return null;
  const processed = await remark().use(html).process(markdown);
  return String(processed);
}

function toRelationDisplay(
  relations: ObjectRelation[],
  targetObject: ScadaObject,
  relatedObjects: Map<number, ScadaObject>
): RelationDisplayItem[] {
  return relations.map((relation) => {
    const isOutgoing = relation.src_object_id === targetObject.id;
    const relatedId = isOutgoing
      ? relation.dst_object_id
      : relation.src_object_id;
    const relatedObject = relatedId
      ? relatedObjects.get(relatedId) ?? null
      : null;
    return {
      id: relation.id,
      relationKind: relation.relation_kind,
      direction: isOutgoing ? "outgoing" : "incoming",
      relatedObjectId: relatedId ?? null,
      relatedObject: relatedObject
        ? { id: relatedObject.id, title: relatedObject.title }
        : null,
    };
  });
}

function countCompletedSubtasks(subtasks: ObjectSubtask[]) {
  return subtasks.filter((subtask) => subtask.is_done).length;
}

export default async function ObjectDetailPage({
  params,
}: {
  params: ObjectPageParams;
}) {
  const projectId = Number(params.projectId);
  const objectId = Number(params.objectId);

  if (Number.isNaN(projectId) || Number.isNaN(objectId)) {
    notFound();
  }

  const supabase = await createClient();
  const object = await objectService.getObjectById(supabase, objectId);

  if (!object || object.project_id !== projectId) {
    notFound();
  }

  const [relations, subtasks, files, lexicon] = await Promise.all([
    objectRelationService.getRelationsByObject(supabase, object.id),
    objectSubtaskService.getSubtasks(supabase, object.id),
    objectFileService.getFilesForObject(supabase, object.id),
    objectLexiconService.getLexiconForObject(supabase, object.id),
  ]);

  const relationIds = Array.from(
    new Set(
      relations.flatMap((relation) => [
        relation.src_object_id,
        relation.dst_object_id,
      ])
    )
  ).filter((id) => id !== object.id);

  const relatedObjects = new Map<number, ScadaObject>();
  if (relationIds.length) {
    const objects = await objectService.getObjectsByIds(supabase, relationIds);
    objects.forEach((related) => {
      relatedObjects.set(related.id, related);
    });
  }

  const relationDisplay: RelationDisplayItem[] = toRelationDisplay(
    relations,
    object,
    relatedObjects
  );

  const descriptionHtml = await renderDescription(object.description_md);
  const completedSubtasks = countCompletedSubtasks(subtasks);

  return (
    <div className="space-y-6 pb-12">
      <ObjectHeader
        title={object.title}
        priority={object.priority}
        assignee={object.assignee}
        dueDate={object.due_date}
        updatedAt={object.updated_at}
        totalSubtasks={subtasks.length}
        completedSubtasks={completedSubtasks}
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <ObjectDescription html={descriptionHtml} />
          <ObjectSubtasksCard subtasks={subtasks} />
          <ObjectRelationsCard relations={relationDisplay} />
        </div>
        <div className="space-y-6">
          <ObjectMetadataCard
            assignee={object.assignee}
            createdAt={object.created_at}
            updatedAt={object.updated_at}
            dueDate={object.due_date}
            priority={object.priority}
            metadata={object.metadata}
          />
          <ObjectFilesCard files={files} />
          <ObjectLexiconCard items={lexicon} />
        </div>
      </div>
    </div>
  );
}
