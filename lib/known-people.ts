"use client";

export interface KnownPerson {
  id: string;
  name: string;
  descriptor: number[]; // Float32Array serialized to array
  thumbnail: string;    // data URL of the face crop
  registeredAt: number;  // timestamp
}

const STORAGE_KEY = "facerec_known_people";

export function getKnownPeople(): KnownPerson[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as KnownPerson[];
  } catch {
    return [];
  }
}

export function savePerson(person: KnownPerson): void {
  const people = getKnownPeople();
  const idx = people.findIndex((p) => p.id === person.id);
  if (idx >= 0) {
    people[idx] = person;
  } else {
    people.push(person);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
}

export function deletePerson(id: string): void {
  const people = getKnownPeople().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
}

export function findMatch(
  descriptor: number[],
  threshold = 0.6
): { person: KnownPerson; distance: number } | null {
  const people = getKnownPeople();
  let best: { person: KnownPerson; distance: number } | null = null;
  for (const person of people) {
    const dist = euclideanDistance(descriptor, person.descriptor);
    if (dist < threshold && (!best || dist < best.distance)) {
      best = { person, distance: dist };
    }
  }
  return best;
}

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}
