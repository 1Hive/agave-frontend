import React from "react";
import styled from "styled-components";

const CardWrapper = styled.div`
  width: 200px;
  border-radius: 15px;
  border-width: 1px;
  border-style: solid;
  margin: 0px 15px;

  &.orange {
    border-color: ${props => props.theme.color.yellow};
    .apycard-title {
      background: ${props => props.theme.color.yellow};
      border-radius: 13px 13px 0px 0px;
    }
  }

  &.blue {
    border-color: ${props => props.theme.color.blue};
    .apycard-title {
      background: ${props => props.theme.color.blue};
      border-radius: 13px 13px 0px 0px;
    }
  }

  &.pink {
    border-color: ${props => props.theme.color.pink};
    .apycard-title {
      background: ${props => props.theme.color.pink};
      border-radius: 13px 13px 0px 0px;
    }
  }

  &.yellow {
    border-color: #ecc94b;
    .apycard-title {
      background: #ecc94b;
      border-radius: 13px 13px 0px 0px;
    }
  }

  &.green {
    border-color: ${props => props.theme.color.green};
    .apycard-title {
      background: ${props => props.theme.color.green};
      border-radius: 13px 13px 0px 0px;
    }
  }

  .apycard-title {
    text-align: center;
    padding: 5px;
    color: ${props => props.theme.color.textSecondary};
    font-size: 10px;
  }

  .apycard-content {
    padding: 10px;
    .apycard-content-row {
      margin-bottom: 8px;
      font-size: 14px;
      display: flex;
      flex-flow: row wrap;
      align-items: flex-start;
      justify-content: space-between;

      &:last-child {
        margin-bottom: 0;
      }

      .apycard-label {
        font-weight: 400;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding-right: 10px;

        span {
          font-size: 12px;
        }
      }

      .apycard-value {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex: 1 1 0%;

        span {
          font-size: 12px;
          font-weight: 600;
        }
      }
    }
  }
`;

const Card: React.FC<{
  color: React.ComponentProps<typeof CardWrapper>["className"];
}> = ({ color, children }) => {
  return <CardWrapper className={color}>{children}</CardWrapper>;
};

export default Card;
