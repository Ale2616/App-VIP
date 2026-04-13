import { VisitRepository } from "@/repositories/visit.repository";

export class VisitService {
  constructor(private visitRepository: VisitRepository) {}

  async trackVisit(ip: string): Promise<void> {
    const visit = this.visitRepository.create({ ip });
    await this.visitRepository.save(visit);
  }

  async getTotalVisits(): Promise<number> {
    return this.visitRepository.countTotalVisits();
  }
}
