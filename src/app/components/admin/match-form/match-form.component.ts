// src/app/components/admin/match-form/match-form.component.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatchDTO, EquipeDTO } from '../../../models';
import { EquipeService } from '../../../services/equipe.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-match-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './match-form.component.html',
  styleUrl: './match-form.component.css'
})
export class MatchFormComponent implements OnInit {
  @Input() match: MatchDTO | null = null;
  @Input() isEditing = false;
  @Output() submitMatch = new EventEmitter<MatchDTO>();
  @Output() cancel = new EventEmitter<void>();

  equipes: EquipeDTO[] = [];
  formData: MatchDTO = {
    equipe1Id: 0,
    equipe2Id: 0,
    dateMatch: this.getDefaultDateTime(),
    resultat: ''
  };

  constructor(private equipeService: EquipeService, private toast: ToastService) {}

  ngOnInit() {
    this.loadEquipes();
    if (this.match) {
      this.formData = { 
        ...this.match,
        dateMatch: this.formatDateForInput(this.match.dateMatch)
      };
    }
  }

  loadEquipes() {
    this.equipeService.equipes$.subscribe(equipes => {
      this.equipes = equipes;
    });
  }

  getAvailableEquipes2(): EquipeDTO[] {
    return this.equipes.filter(equipe => equipe.id !== this.formData.equipe1Id);
  }

  onEquipe1Change() {
    // Si équipe2 est la même que équipe1, la réinitialiser
    if (this.formData.equipe2Id === this.formData.equipe1Id) {
      this.formData.equipe2Id = 0;
    }
  }

  onSubmit() {
    if (!this.isFormValid()) {
      this.toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (this.formData.equipe1Id === this.formData.equipe2Id) {
      this.toast.error('Une équipe ne peut pas jouer contre elle-même.');
      return;
    }

    const matchToSubmit: MatchDTO = {
      ...this.formData,
      dateMatch: this.formatDateForApi(this.formData.dateMatch)
    };

    if (this.isEditing && this.match?.id) {
      matchToSubmit.id = this.match.id;
    }

    this.submitMatch.emit(matchToSubmit);
  }

  onCancel() {
    this.cancel.emit();
  }

  isFormValid(): boolean {
    return !!(
      this.formData.equipe1Id && 
      this.formData.equipe2Id && 
      this.formData.dateMatch
    );
  }

  private getDefaultDateTime(): string {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return this.formatDateForInput(now.toISOString());
  }

  private formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  }

  private formatDateForApi(dateString: string): string {
    return new Date(dateString).toISOString();
  }
}