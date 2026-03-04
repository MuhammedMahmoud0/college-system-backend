-- CreateTable
CREATE TABLE "grade_distributions" (
    "id" SERIAL NOT NULL,
    "lecture_id" INTEGER NOT NULL,
    "work_max" DOUBLE PRECISION NOT NULL,
    "mid_max" DOUBLE PRECISION NOT NULL,
    "final_max" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "grade_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "grade_distributions_lecture_id_key" ON "grade_distributions"("lecture_id");

-- AddForeignKey
ALTER TABLE "grade_distributions" ADD CONSTRAINT "grade_distributions_lecture_id_fkey" FOREIGN KEY ("lecture_id") REFERENCES "lectures"("lecture_id") ON DELETE CASCADE ON UPDATE NO ACTION;
