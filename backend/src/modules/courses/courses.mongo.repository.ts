import { CourseContentModel, CourseContentDocument } from './courseContent.model';

export async function createCourseContent(courseId: string): Promise<void> {
  await CourseContentModel.create({
    courseId,
    banner: {},
    finalQuiz: null,
    contentVersion: 1,
  });
}

export async function findCourseContentByCourseId(courseId: string): Promise<CourseContentDocument | null> {
  return CourseContentModel.findOne({ courseId }).exec();
}

/**
 * Rollback/cleanup path only — kept for symmetry with the Postgres side's
 * deleteCourseHard(); the normal create flow never needs it since Postgres
 * is written first and Mongo failing triggers a Postgres rollback instead.
 */
export async function deleteCourseContent(courseId: string): Promise<void> {
  await CourseContentModel.deleteOne({ courseId }).exec();
}
