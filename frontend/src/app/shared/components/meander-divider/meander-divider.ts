import { Component, Input } from '@angular/core';

/**
 * Signature decorative element: a repeating Greek key / meander strip.
 * Used as a section divider throughout the site instead of a plain <hr>,
 * tying every seam in the layout back to the Odyssey theme.
 */
@Component({
  selector: 'app-meander-divider',
  standalone: true,
  template: `
    <div class="meander" [class.meander--inverted]="inverted" [attr.aria-hidden]="true">
      <svg viewBox="0 0 80 10" preserveAspectRatio="xMidYMid meet">
        <path
          d="M0 0 H10 V6 H4 V4 H8 V10 H0 Z
             M20 0 H30 V6 H24 V4 H28 V10 H20 Z
             M40 0 H50 V6 H44 V4 H48 V10 H40 Z
             M60 0 H70 V6 H64 V4 H68 V10 H60 Z"
        />
      </svg>
    </div>
  `,
  styleUrl: './meander-divider.scss',
})
export class MeanderDivider {
  @Input() inverted = false;
}
