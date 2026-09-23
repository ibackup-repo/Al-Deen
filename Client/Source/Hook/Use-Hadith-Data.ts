import { useQuery } from '@tanstack/react-query';
import {
  Get_Chapters_By_Collection,
  Get_Chapter,
  Get_Hadiths_By_Chapter,
  type Hadith_Chapter_Meta,
  type Hadith_Chapter,
  type Hadith,
} from 'Server/API/Hadith';

export function Use_Hadith_Chapters(Collection_ID: string) {
  return useQuery<Hadith_Chapter_Meta[], error>({
    queryKey: ['Hadith-chapters', Collection_ID],
    queryFn: () => Get_Chapters_By_Collection(Collection_ID),
    staleTime: 1000 * 60 * 60,
    enabled: !!Collection_ID,
  });
}

export function Use_Hadith_Chapter(Collection_ID: string, Chapter_ID: string) {
  return useQuery<Hadith_Chapter | null, error>({
    queryKey: ['Hadith-chapter', Collection_ID, Chapter_ID],
    queryFn: () => Get_Chapter(Collection_ID, Chapter_ID),
    staleTime: 1000 * 60 * 60,
    enabled: !!Collection_ID && !!Chapter_ID,
  });
}

export function Use_Hadiths_By_Chapter(Collection_ID: string, Chapter_ID: string) {
  return useQuery<Hadith[], error>({
    queryKey: ['Hadith-Hadith', Collection_ID, Chapter_ID],
    queryFn: () => Get_Hadiths_By_Chapter(Collection_ID, Chapter_ID),
    staleTime: 1000 * 60 * 60,
    enabled: !!Collection_ID && !!Chapter_ID,
  });
}
