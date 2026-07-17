import React from 'react';
import styled from 'styled-components';

const Svg = styled.svg`
  width: 12px;
  height: 12px;
`;

function CheckboxCheckedIcon() {
  return (
    <Svg fill="none" height="12" viewBox="0 0 12 12" width="12" xmlns="http://www.w3.org/2000/svg">
      <rect fill="#178733" height="11" rx="3.5" width="11" x="0.5" y="0.5" />
      <rect height="11" rx="3.5" stroke="#178733" width="11" x="0.5" y="0.5" />
      <path
        d="M9.15531 3.59459C9.29591 3.73524 9.3749 3.92597 9.3749 4.12484C9.3749 4.32371 9.29591 4.51444 9.15531 4.65509L5.40531 8.40509C5.26467 8.54569 5.07393 8.62468 4.87506 8.62468C4.67619 8.62468 4.48546 8.54569 4.34481 8.40509L2.84481 6.90509C2.70819 6.76364 2.6326 6.57419 2.63431 6.37754C2.63601 6.18089 2.71489 5.99278 2.85395 5.85373C2.993 5.71467 3.18111 5.63579 3.37776 5.63408C3.57441 5.63238 3.76386 5.70797 3.90531 5.84459L4.87506 6.81434L8.09481 3.59459C8.23546 3.45399 8.42619 3.375 8.62506 3.375C8.82393 3.375 9.01467 3.45399 9.15531 3.59459Z"
        fill="white"
      />
    </Svg>
  );
}

export default CheckboxCheckedIcon;
