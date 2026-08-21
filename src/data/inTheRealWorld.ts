import projectOneVideo from '../../Project 6.mp4';
import projectTwoVideo from '../../PROJECT 2.mp4';
import projectFourImage from '../../PROJECT 4.jpeg';
import projectThreeVideo from '../../Project 3.mp4';
import projectFiveVideo from '../../Project 5.mp4';
import projectSixVideo from '../../PROJECT 1.mp4';
import projectOnePoster from '../../v1.jpeg';
import projectTwoPoster from '../../cover.jpeg';

export interface InTheRealWorldProject {
  id: string;
  media: string;
  type: 'video' | 'image';
  alt: string;
  poster?: string;
}

export const inTheRealWorldProjects: InTheRealWorldProject[] = [
  { id: 'real-world-01', media: projectOneVideo, type: 'video', alt: 'Oak Cherry Kraft featured project footage', poster: projectOnePoster },
  { id: 'real-world-02', media: projectTwoVideo, type: 'video', alt: 'Oak Cherry Kraft supporting project footage', poster: projectTwoPoster },
  { id: 'real-world-04', media: projectFourImage, type: 'image', alt: 'Oak Cherry Kraft featured project' },
  { id: 'real-world-03', media: projectThreeVideo, type: 'video', alt: 'Oak Cherry Kraft additional project footage' },
  { id: 'real-world-05', media: projectFiveVideo, type: 'video', alt: 'Oak Cherry Kraft additional project footage' },
  { id: 'real-world-06', media: projectSixVideo, type: 'video', alt: 'Oak Cherry Kraft additional project footage' },
];
