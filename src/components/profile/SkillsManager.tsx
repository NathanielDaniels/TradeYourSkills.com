"use client";
import ConfirmModal from "@/components/ConfirmModal";
import InputModal from "@/components/InputModal";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useSkillsManager } from "@/hooks/useSkillsManager";
import { useValidation } from "@/hooks/useValidation";

interface Skill {
  id: string;
  name: string;
}

interface SkillsManagerProps {
  skills: Skill[];
  onSkillsUpdate: (skills: Skill[]) => void;
}

export default function SkillsManager({
  skills,
  onSkillsUpdate,
}: SkillsManagerProps) {
  const {
    localSkills,
    confirmOpen,
    setConfirmOpen,
    addSkillOpen,
    setAddSkillOpen,
    hasOrderChanged,
    isSaving,
    deletingSkillId,
    confirmAddSkill,
    handleRemoveClick,
    confirmRemoveSkill,
    handleSaveOrder,
    handleReorder,
  } = useSkillsManager(skills, onSkillsUpdate);

  const { errors } = useValidation();
  const { getDragProps, getDragStyles } = useDragAndDrop({
    items: localSkills,
    onReorder: handleReorder,
    getItemId: (skill) => skill.id,
  });

  return (
    <aside
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      aria-labelledby="skills-heading"
    >
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h2
            id="skills-heading"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            Skills
          </h2>
        </div>
        {hasOrderChanged && (
          <button
            onClick={handleSaveOrder}
            disabled={isSaving}
            className="px-3 py-1 text-sm rounded bg-blue-500 text-white disabled:bg-blue-300 flex items-center gap-2 transition-colors duration-200 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              "Save Order"
            )}
          </button>
        )}
        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
          {localSkills.length}
        </span>
      </header>

      {/* Skills List */}
      <ul className="space-y-3 mb-4">
        {localSkills.length > 0 ? (
          localSkills.map((skill) => {
            const dragProps = getDragProps(skill);
            const dragStyles = getDragStyles(skill);
            return (
              <li
                key={skill.id}
                {...dragProps}
                className={`flex items-center justify-between p-3 rounded-lg group cursor-move transition-all ${
                  dragStyles.isDragOver
                    ? "bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-400"
                    : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                } ${dragStyles.isDragging ? "opacity-50 scale-95" : ""}`}
              >
                <div className="flex items-center flex-1">
                  <div className="mr-3 text-gray-400 dark:text-gray-500 group-hover:text-gray-600">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 9h8M8 15h8"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {skill.name}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveClick(skill.id)}
                  aria-label={`Remove ${skill.name} skill`}
                  title={`Remove ${skill.name}`}
                  disabled={deletingSkillId === skill.id}
                  className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${
                    deletingSkillId === skill.id
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  }`}
                >
                  {deletingSkillId === skill.id ? (
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </button>
              </li>
            );
          })
        ) : (
          <li className="text-center py-8 text-gray-500 dark:text-gray-400">
            No skills added yet
          </li>
        )}
      </ul>

      <footer>
        <button
          onClick={() => setAddSkillOpen(true)}
          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 rounded-lg"
        >
          + Add New Skill
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Maximum 10 skills • {10 - localSkills.length} remaining
        </p>
      </footer>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Remove Skill?"
        message="Are you sure you want to remove this skill? This cannot be undone."
        onConfirm={confirmRemoveSkill}
        onCancel={() => setConfirmOpen(false)}
        showDefaultToast={false}
      />

      <InputModal
        isOpen={addSkillOpen}
        title="Add New Skill"
        message="Enter the name of the skill you want to add."
        placeholder="e.g., Web Design"
        onConfirm={confirmAddSkill}
        onCancel={() => setAddSkillOpen(false)}
        error={errors.skill}
      />
    </aside>
  );
}
